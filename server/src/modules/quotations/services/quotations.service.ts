import {
  quotationsRepository,
  QuotationsRepository,
  PaginatedQuotations,
  QuotationWithDetails,
  QuotationItemWithProduct,
} from '../repositories/quotations.repository.js';
import {
  CreateQuotationInput,
  UpdateQuotationInput,
  AddQuotationItemInput,
  UpdateQuotationItemInput,
  QuotationQueryInput,
  NegotiateQuotationInput,
  ReviseQuotationInput,
  QuotationOutcomeInput,
} from '../validators/quotation.validator.js';
import { QuotationStatuses } from '../constants/quotationStatus.js';
import { customersRepository } from '../../customers/repositories/customers.repository.js';
import { priceListsRepository } from '../../price-lists/repositories/priceLists.repository.js';
import { productsRepository } from '../../products/repositories/products.repository.js';
import { pricingService } from '../../pricing/services/pricing.service.js';
import { Quotation, QuotationItem, quotations, quotationItems } from '../../../database/schema/index.js';
import { db } from '../../../database/db.js';
import { AuthUserContext } from '../../rbac/types/index.js';
import { Roles } from '../../rbac/constants/roles.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../../common/errors/index.js';
import { ApprovalRoutingService } from '../../discount-governance/services/approvalRouting.service.js';

export class QuotationsService {
  private approvalRoutingService: ApprovalRoutingService;

  constructor(
    private readonly repository: QuotationsRepository = quotationsRepository,
    routingService: ApprovalRoutingService = new ApprovalRoutingService()
  ) {
    this.approvalRoutingService = routingService;
  }

  private canAccessAllQuotations(user: AuthUserContext): boolean {
    return (
      user.roles.includes(Roles.ADMIN) ||
      user.roles.includes(Roles.SALES_MANAGER) ||
      user.roles.includes(Roles.FINANCE)
    );
  }

  private assertQuotationOwnership(quotation: Quotation, user: AuthUserContext): void {
    if (!this.canAccessAllQuotations(user) && quotation.createdBy !== user.userId) {
      throw new ForbiddenError('Access denied: You can only access your own quotations');
    }
  }

  private assertQuotationEditable(quotation: Quotation): void {
    const unmodifiableStatuses: string[] = [
      QuotationStatuses.SENT,
      QuotationStatuses.NEGOTIATION,
      QuotationStatuses.WON,
      QuotationStatuses.LOST,
      QuotationStatuses.CANCELLED,
      QuotationStatuses.EXPIRED,
    ];

    if (unmodifiableStatuses.includes(quotation.status)) {
      throw new BadRequestError(
        `Quotation ${quotation.quotationNumber} is in '${quotation.status}' status and cannot be modified`
      );
    }
  }

  async listQuotations(
    query: QuotationQueryInput,
    user: AuthUserContext
  ): Promise<PaginatedQuotations> {
    const userOwnershipId = this.canAccessAllQuotations(user) ? undefined : user.userId;
    return this.repository.findAll(query, userOwnershipId);
  }

  async getQuotationById(id: string, user: AuthUserContext): Promise<QuotationWithDetails> {
    const quotation = await this.repository.findById(id);
    if (!quotation) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    this.assertQuotationOwnership(quotation, user);
    return quotation;
  }

  async createQuotation(data: CreateQuotationInput, user: AuthUserContext): Promise<Quotation> {
    // 1. Verify customer exists and is active
    const customer = await customersRepository.findById(data.customerId);
    if (!customer) {
      throw new NotFoundError(`Customer with ID '${data.customerId}' not found`);
    }
    if (customer.status !== 'ACTIVE') {
      throw new BadRequestError(`Cannot create quotation for inactive customer '${customer.companyName}'`);
    }

    // 2. Verify price list exists and is active
    const priceList = await priceListsRepository.findById(data.priceListId);
    if (!priceList) {
      throw new NotFoundError(`Price list with ID '${data.priceListId}' not found`);
    }
    if (!priceList.isActive) {
      throw new BadRequestError(`Cannot create quotation with inactive price list '${priceList.name}'`);
    }

    const targetCurrency = data.currency ? data.currency.trim().toUpperCase() : priceList.currency;

    // 3. Optimized single-request batch creation if items are provided
    if (data.items && data.items.length > 0) {
      // Pre-validate and resolve products in parallel
      const productMap = new Map();
      for (const item of data.items) {
        if (!productMap.has(item.productId)) {
          const prod = await productsRepository.findById(item.productId);
          if (!prod) {
            throw new NotFoundError(`Product with ID '${item.productId}' not found`);
          }
          if (!prod.isActive) {
            throw new BadRequestError(`Cannot add inactive product '${prod.name}' to quotation`);
          }
          if (prod.stock !== undefined && prod.stock !== null && item.quantity > prod.stock) {
            throw new BadRequestError(
              `Insufficient stock for '${prod.name}' (SKU: ${prod.sku}). Requested quantity: ${item.quantity}, Available stock: ${prod.stock}`
            );
          }
          productMap.set(item.productId, prod);
        }
      }

      // Resolve prices and calculations concurrently
      const resolvedItems = await Promise.all(
        data.items.map(async (item) => {
          const product = productMap.get(item.productId)!;
          const priceResolution = await pricingService.resolveProductPrice({
            productId: item.productId,
            priceListId: data.priceListId,
            currency: targetCurrency,
          });

          const unitPriceNum = parseFloat(priceResolution.effectivePrice) || 0;
          const quantity = item.quantity;
          const discountPercentNum = parseFloat(item.discountPercent) || 0;

          const grossAmountNum = unitPriceNum * quantity;
          const discountAmountNum = (grossAmountNum * discountPercentNum) / 100;
          const netAmountNum = grossAmountNum - discountAmountNum;

          return {
            productId: item.productId,
            productNameSnapshot: product.name,
            skuSnapshot: product.sku,
            quantity,
            unitPrice: unitPriceNum.toFixed(2),
            discountPercent: discountPercentNum.toFixed(2),
            grossAmount: grossAmountNum.toFixed(2),
            discountAmount: discountAmountNum.toFixed(2),
            netAmount: netAmountNum.toFixed(2),
          };
        })
      );

      // In-memory total computation
      let subtotalNum = 0;
      let discountAmountNum = 0;
      let totalAmountNum = 0;

      for (const ri of resolvedItems) {
        subtotalNum += parseFloat(ri.grossAmount) || 0;
        discountAmountNum += parseFloat(ri.discountAmount) || 0;
        totalAmountNum += parseFloat(ri.netAmount) || 0;
      }

      // Execute header and line items insertion in a single atomic transaction
      const quotationNumber = await this.repository.generateNextQuotationNumber();

      const createdQuotation = await db.transaction(async (tx) => {
        const [insertedHeader] = await tx
          .insert(quotations)
          .values({
            quotationNumber,
            customerId: data.customerId,
            priceListId: data.priceListId,
            status: QuotationStatuses.DRAFT,
            currency: targetCurrency,
            subtotal: subtotalNum.toFixed(2),
            discountAmount: discountAmountNum.toFixed(2),
            totalAmount: totalAmountNum.toFixed(2),
            issueDate: data.issueDate,
            expiryDate: data.expiryDate,
            notes: data.notes?.trim() || null,
            versionNumber: 1,
            isCustomerVisible: true,
            createdBy: user.userId,
          })
          .returning();

        // Batch insert items in single query
        await tx.insert(quotationItems).values(
          resolvedItems.map((item) => ({
            ...item,
            quotationId: insertedHeader.id,
          }))
        );

        return insertedHeader;
      });

      // If user requested immediate approval submission
      if (data.submitForApproval) {
        await this.approvalRoutingService.submitQuotation(
          createdQuotation.id,
          user.userId,
          user.roles[0] || Roles.SALES_REP,
          data.submitNotes
        );
        const refreshed = await this.repository.findById(createdQuotation.id);
        if (refreshed) return refreshed;
      }

      return createdQuotation;
    }

    // 4. Default single-header creation (when items are not passed in payload)
    const quotationNumber = await this.repository.generateNextQuotationNumber();

    return this.repository.create({
      quotationNumber,
      customerId: data.customerId,
      priceListId: data.priceListId,
      status: QuotationStatuses.DRAFT,
      currency: targetCurrency,
      subtotal: '0.00',
      discountAmount: '0.00',
      totalAmount: '0.00',
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      notes: data.notes?.trim() || null,
      versionNumber: 1,
      isCustomerVisible: true,
      createdBy: user.userId,
    });
  }

  async updateQuotation(
    id: string,
    data: UpdateQuotationInput,
    user: AuthUserContext
  ): Promise<Quotation> {
    const current = await this.getQuotationById(id, user);
    this.assertQuotationEditable(current);

    if (data.customerId) {
      const customer = await customersRepository.findById(data.customerId);
      if (!customer) {
        throw new NotFoundError(`Customer with ID '${data.customerId}' not found`);
      }
      if (customer.status !== 'ACTIVE') {
        throw new BadRequestError(`Cannot assign inactive customer '${customer.companyName}'`);
      }
    }

    if (data.priceListId && data.priceListId !== current.priceListId) {
      const priceList = await priceListsRepository.findById(data.priceListId);
      if (!priceList) {
        throw new NotFoundError(`Price list with ID '${data.priceListId}' not found`);
      }
      if (!priceList.isActive) {
        throw new BadRequestError(`Cannot assign inactive price list '${priceList.name}'`);
      }

      // Check if items already exist
      const existingItems = await this.repository.findItemsByQuotationId(id);
      if (existingItems.length > 0) {
        throw new BadRequestError(
          'Cannot change price list on a quotation that already contains line items'
        );
      }
    }

    // If quotation was in an approval state, modifying it invalidates previous approvals
    await this.approvalRoutingService.invalidateWorkflowOnQuotationMutation(id);

    const updated = await this.repository.update(id, {
      ...(data.customerId ? { customerId: data.customerId } : {}),
      ...(data.priceListId ? { priceListId: data.priceListId } : {}),
      ...(data.issueDate ? { issueDate: data.issueDate } : {}),
      ...(data.expiryDate ? { expiryDate: data.expiryDate } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.status ? { status: data.status } : {}),
    });

    if (!updated) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    return updated;
  }

  async cancelQuotation(id: string, user: AuthUserContext): Promise<Quotation> {
    const current = await this.getQuotationById(id, user);

    if (current.status === QuotationStatuses.CANCELLED) {
      return current;
    }

    // Invalidate pending approvals
    await this.approvalRoutingService.invalidateWorkflowOnQuotationMutation(id);

    const updated = await this.repository.update(id, {
      status: QuotationStatuses.CANCELLED,
    });

    if (!updated) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    return updated;
  }

  // --- Line Items Operations ---

  async addItem(
    quotationId: string,
    data: AddQuotationItemInput,
    user: AuthUserContext
  ): Promise<{ item: QuotationItem; quotation: Quotation }> {
    const quotation = await this.getQuotationById(quotationId, user);
    this.assertQuotationEditable(quotation);

    // 1. Invalidate previous approval workflow on commercial mutation
    await this.approvalRoutingService.invalidateWorkflowOnQuotationMutation(quotationId);

    // 2. Verify product exists and is active
    const product = await productsRepository.findById(data.productId);
    if (!product) {
      throw new NotFoundError(`Product with ID '${data.productId}' not found`);
    }
    if (!product.isActive) {
      throw new BadRequestError(`Cannot add inactive product '${product.name}' to quotation`);
    }
    if (product.stock !== undefined && product.stock !== null && data.quantity > product.stock) {
      throw new BadRequestError(
        `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Requested quantity: ${data.quantity}, Available stock: ${product.stock}`
      );
    }

    // 3. Resolve price using PricingService
    const priceResolution = await pricingService.resolveProductPrice({
      productId: data.productId,
      priceListId: quotation.priceListId,
      currency: quotation.currency,
    });

    const unitPriceNum = parseFloat(priceResolution.effectivePrice) || 0;
    const quantity = data.quantity;
    const discountPercentNum = parseFloat(data.discountPercent) || 0;

    const grossAmountNum = unitPriceNum * quantity;
    const discountAmountNum = (grossAmountNum * discountPercentNum) / 100;
    const netAmountNum = grossAmountNum - discountAmountNum;

    // 4. Create item with snapshots
    const item = await this.repository.createItem({
      quotationId,
      productId: data.productId,
      productNameSnapshot: product.name,
      skuSnapshot: product.sku,
      quantity,
      unitPrice: unitPriceNum.toFixed(2),
      discountPercent: discountPercentNum.toFixed(2),
      grossAmount: grossAmountNum.toFixed(2),
      discountAmount: discountAmountNum.toFixed(2),
      netAmount: netAmountNum.toFixed(2),
    });

    // 5. Recalculate quotation totals
    const updatedQuotation = await this.repository.recalculateAndSaveTotals(quotationId);

    return { item, quotation: updatedQuotation };
  }

  async updateItem(
    quotationId: string,
    itemId: string,
    data: UpdateQuotationItemInput,
    user: AuthUserContext
  ): Promise<{ item: QuotationItemWithProduct; quotation: Quotation }> {
    const quotation = await this.getQuotationById(quotationId, user);
    this.assertQuotationEditable(quotation);

    // 1. Invalidate previous approval workflow on commercial mutation
    await this.approvalRoutingService.invalidateWorkflowOnQuotationMutation(quotationId);

    const existingItem = await this.repository.findItemById(itemId);
    if (!existingItem || existingItem.quotationId !== quotationId) {
      throw new NotFoundError(`Quotation item with ID '${itemId}' not found in this quotation`);
    }

    const quantity = data.quantity !== undefined ? data.quantity : existingItem.quantity;
    const discountPercentNum =
      data.discountPercent !== undefined
        ? parseFloat(data.discountPercent) || 0
        : parseFloat(existingItem.discountPercent) || 0;
    const unitPriceNum = parseFloat(existingItem.unitPrice) || 0;

    const grossAmountNum = unitPriceNum * quantity;
    const discountAmountNum = (grossAmountNum * discountPercentNum) / 100;
    const netAmountNum = grossAmountNum - discountAmountNum;

    const updatedItem = await this.repository.updateItem(itemId, {
      quantity,
      discountPercent: discountPercentNum.toFixed(2),
      grossAmount: grossAmountNum.toFixed(2),
      discountAmount: discountAmountNum.toFixed(2),
      netAmount: netAmountNum.toFixed(2),
    });

    if (!updatedItem) {
      throw new NotFoundError(`Quotation item with ID '${itemId}' not found`);
    }

    const updatedQuotation = await this.repository.recalculateAndSaveTotals(quotationId);

    return {
      item: {
        ...updatedItem,
        product: existingItem.product,
      },
      quotation: updatedQuotation,
    };
  }

  async deleteItem(
    quotationId: string,
    itemId: string,
    user: AuthUserContext
  ): Promise<{ quotation: Quotation }> {
    const quotation = await this.getQuotationById(quotationId, user);
    this.assertQuotationEditable(quotation);

    // 1. Invalidate previous approval workflow on commercial mutation
    await this.approvalRoutingService.invalidateWorkflowOnQuotationMutation(quotationId);

    const existingItem = await this.repository.findItemById(itemId);
    if (!existingItem || existingItem.quotationId !== quotationId) {
      throw new NotFoundError(`Quotation item with ID '${itemId}' not found in this quotation`);
    }

    await this.repository.deleteItem(itemId);
    const updatedQuotation = await this.repository.recalculateAndSaveTotals(quotationId);

    return { quotation: updatedQuotation };
  }

  // --- Negotiation, Revision, and Win/Loss Workflow Operations ---

  async sendQuotation(id: string, user: AuthUserContext): Promise<Quotation> {
    const quotation = await this.getQuotationById(id, user);

    const allowedToSend: string[] = [
      QuotationStatuses.APPROVED,
      QuotationStatuses.DRAFT,
      QuotationStatuses.NEGOTIATION,
    ];

    if (!allowedToSend.includes(quotation.status)) {
      throw new BadRequestError(
        `Quotation ${quotation.quotationNumber} is in '${quotation.status}' status and cannot be sent to customer`
      );
    }

    const updated = await this.repository.update(id, {
      status: QuotationStatuses.SENT,
    });

    if (!updated) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    return updated;
  }

  async negotiateQuotation(
    id: string,
    data: NegotiateQuotationInput,
    user: AuthUserContext
  ): Promise<Quotation> {
    const quotation = await this.getQuotationById(id, user);

    const allowedStatuses: string[] = [
      QuotationStatuses.SENT,
      QuotationStatuses.APPROVED,
      QuotationStatuses.NEGOTIATION,
    ];

    if (!allowedStatuses.includes(quotation.status)) {
      throw new BadRequestError(
        `Only sent or approved quotations can move into negotiation. Current status is '${quotation.status}'`
      );
    }

    let updatedNotes = quotation.notes || '';
    if (data.notes) {
      const negotiationEntry = `[Client Negotiation ${new Date().toLocaleDateString()}]: ${data.notes}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n\n${negotiationEntry}` : negotiationEntry;
    }

    const updated = await this.repository.update(id, {
      status: QuotationStatuses.NEGOTIATION,
      notes: updatedNotes || null,
    });

    if (!updated) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    return updated;
  }

  async reviseQuotation(
    id: string,
    data: ReviseQuotationInput,
    user: AuthUserContext
  ): Promise<QuotationWithDetails> {
    const parent = await this.getQuotationById(id, user);

    const existingItems = await this.repository.findItemsByQuotationId(id);
    if (existingItems.length === 0) {
      throw new BadRequestError(
        `Cannot revise quotation '${parent.quotationNumber}' because it contains no line items`
      );
    }

    const revisionNumber = await this.repository.generateNextRevisionNumber(parent.quotationNumber);
    const today = new Date().toISOString().split('T')[0];
    const expiryDateObj = new Date();
    expiryDateObj.setDate(expiryDateObj.getDate() + 30);
    const expiryDate = expiryDateObj.toISOString().split('T')[0];

    const revNote = `Revision of ${parent.quotationNumber}${data?.notes ? `: ${data.notes}` : ''}`;
    const fullNotes = parent.notes ? `${revNote}\n\n[Original]: ${parent.notes}` : revNote;

    const createdQuotation = await db.transaction(async (tx) => {
      const [insertedHeader] = await tx
        .insert(quotations)
        .values({
          quotationNumber: revisionNumber,
          customerId: parent.customerId,
          priceListId: parent.priceListId,
          status: QuotationStatuses.DRAFT,
          currency: parent.currency,
          subtotal: parent.subtotal,
          discountAmount: parent.discountAmount,
          totalAmount: parent.totalAmount,
          issueDate: today,
          expiryDate: expiryDate,
          notes: fullNotes,
          parentQuotationId: parent.id,
          versionNumber: (parent.versionNumber || 1) + 1,
          isCustomerVisible: false,
          revisionReason: data?.notes?.trim() || `Revision of ${parent.quotationNumber}`,
          createdBy: user.userId,
        })
        .returning();

      for (const item of existingItems) {
        await tx.insert(quotationItems).values({
          quotationId: insertedHeader.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          skuSnapshot: item.skuSnapshot,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          grossAmount: item.grossAmount,
          discountAmount: item.discountAmount,
          netAmount: item.netAmount,
        });
      }

      return insertedHeader;
    });

    this.repository.invalidateCache();
    return this.getQuotationById(createdQuotation.id, user);
  }

  async markQuotationWon(
    id: string,
    data: QuotationOutcomeInput,
    user: AuthUserContext
  ): Promise<Quotation> {
    const quotation = await this.getQuotationById(id, user);

    let updatedNotes = quotation.notes || '';
    if (data.notes) {
      const winNote = `[Deal Won ${new Date().toLocaleDateString()}]: ${data.notes}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n\n${winNote}` : winNote;
    }

    const updated = await this.repository.update(id, {
      status: QuotationStatuses.WON,
      notes: updatedNotes || null,
    });

    if (!updated) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    return updated;
  }

  async markQuotationLost(
    id: string,
    data: QuotationOutcomeInput,
    user: AuthUserContext
  ): Promise<Quotation> {
    const quotation = await this.getQuotationById(id, user);

    let updatedNotes = quotation.notes || '';
    const lossReason = data.reason || data.notes;
    if (lossReason) {
      const lossNote = `[Deal Lost ${new Date().toLocaleDateString()}]: ${lossReason}`;
      updatedNotes = updatedNotes ? `${updatedNotes}\n\n${lossNote}` : lossNote;
    }

    const updated = await this.repository.update(id, {
      status: QuotationStatuses.LOST,
      notes: updatedNotes || null,
    });

    if (!updated) {
      throw new NotFoundError(`Quotation with ID '${id}' not found`);
    }

    return updated;
  }
}

export const quotationsService = new QuotationsService();
