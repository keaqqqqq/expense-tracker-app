import { z } from 'zod';

const TransactionSchema = z
    .object({
        payer_id: z
            .string()
            .min(1, 'Description is required')
            .max(255, 'Description cannot be longer than 255 characters'),
        receiver_id: z
            .string()
            .min(0.01, 'Amount must be greater than 0'),
        expense_id: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter the date'),
        created_at: z
            .string()
            .min(1, 'Category is required'),
        amount: z
            .string()
            .min(0.01, 'Amount must be greater than 0'),
    })
    .superRefine((data, ctx) => {
        // Validate sum of payer amounts matches total amount
        if (data.payer_id === data.receiver_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'The payer and receiver cannot be the same ',
                path: ['payer'], // Points to the payer field
            });
        }
    });

export { TransactionSchema };
