
import { type CreatePaymentIntentInput, type PaymentIntentResponse } from '../schema';

export declare function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResponse>;
