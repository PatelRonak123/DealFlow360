import { productsRepository } from '../../products/repositories/products.repository.js';
import { priceListsRepository } from '../../price-lists/repositories/priceLists.repository.js';
import { NotFoundError, BadRequestError } from '../../../common/errors/index.js';

export type PriceSource = 'PRICE_LIST' | 'BASE_PRICE';

export interface ProductPriceResolution {
  productId: string;
  productName: string;
  sku: string;
  basePrice: string;
  effectivePrice: string;
  priceListId: string | null;
  priceListName: string | null;
  priceSource: PriceSource;
  currency: string;
}

export class PricingService {
  async resolveProductPrice(params: {
    productId: string;
    priceListId?: string;
    currency?: string;
  }): Promise<ProductPriceResolution> {
    const { productId, priceListId, currency } = params;

    // 1. Fetch product
    const product = await productsRepository.findById(productId);
    if (!product) {
      throw new NotFoundError(`Product with ID '${productId}' not found`);
    }
    if (!product.isActive) {
      throw new BadRequestError(`Cannot price inactive product '${product.name}'`);
    }

    // 2. Specific price list requested
    if (priceListId) {
      const priceList = await priceListsRepository.findById(priceListId);
      if (!priceList) {
        throw new NotFoundError(`Price list with ID '${priceListId}' not found`);
      }
      if (!priceList.isActive) {
        throw new BadRequestError(`Cannot resolve price from inactive price list '${priceList.name}'`);
      }

      const item = await priceListsRepository.findItem(priceListId, productId);
      if (item) {
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          basePrice: product.basePrice,
          effectivePrice: item.price,
          priceListId: priceList.id,
          priceListName: priceList.name,
          priceSource: 'PRICE_LIST',
          currency: priceList.currency,
        };
      }

      // Fall back to product base price if not specifically configured in requested price list
      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        basePrice: product.basePrice,
        effectivePrice: product.basePrice,
        priceListId: null,
        priceListName: null,
        priceSource: 'BASE_PRICE',
        currency: product.currency,
      };
    }

    // 3. No specific price list requested -> Check for active default price list for the currency
    const targetCurrency = currency || product.currency;
    const defaultPriceList = await priceListsRepository.findDefaultByCurrency(targetCurrency);

    if (defaultPriceList) {
      const item = await priceListsRepository.findItem(defaultPriceList.id, productId);
      if (item) {
        return {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          basePrice: product.basePrice,
          effectivePrice: item.price,
          priceListId: defaultPriceList.id,
          priceListName: defaultPriceList.name,
          priceSource: 'PRICE_LIST',
          currency: defaultPriceList.currency,
        };
      }
    }

    // 4. Default fallback to base price
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      basePrice: product.basePrice,
      effectivePrice: product.basePrice,
      priceListId: null,
      priceListName: null,
      priceSource: 'BASE_PRICE',
      currency: product.currency,
    };
  }
}

export const pricingService = new PricingService();
