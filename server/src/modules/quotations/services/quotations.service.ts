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
} from '../validators/quotation.validator.js';
import { QuotationStatuses } from '../constants/quotationStatus.js';
import { customersRepository } from '../../customers/repositories/customers.repository.js';
import { priceListsRepository } from '../../price-lists/repositories/priceLists.repository.js';
import { productsRepository } from '../../products/repositories/products.repository.js';
import { pricingService } from '../../pricing/services/pricing.service.js';
import { Quotation, QuotationItem } from '../../../database/schema/index.js';
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

    // 3. Generate monotonic unique quotation number
    const quotationNumber = await this.repository.generateNextQuotationNumber();

    return this.repository.create({
      quotationNumber,
      customerId: data.customerId,
      priceListId: data.priceListId,
      status: QuotationStatuses.DRAFT,
      currency: data.currency ? data.currency.trim().toUpperCase() : priceList.currency,
      subtotal: '0.00',
      discountAmount: '0.00',
      totalAmount: '0.00',
      issueDate: data.issueDate,
      expiryDate: data.expiryDate,
      notes: data.notes?.trim() || null,
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
}

export const quotationsService = new QuotationsService();
