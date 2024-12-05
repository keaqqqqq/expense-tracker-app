import { z } from 'zod';

const ExpenseSchema = z
  .object({
    description: z
      .string()
      .min(1, 'Description is required')
      .max(255, 'Description cannot be longer than 255 characters'),
    amount: z
      .number()
      .min(0.01, 'Amount must be greater than 0'),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please enter the date'),
    category: z
      .string()
      .min(1, 'Category is required'),
    payer: z
      .array(
        z.object({
          amount: z.number().min(0, 'Payer amount must be non-negative'),
        })
      )
      .nonempty('At least one payer is required'), // Ensure at least one payer
    splitter: z
      .array(
        z.object({
          amount: z.number().min(0, 'Splitter amount must be non-negative'),
        })
      )
      .nonempty('At least one splitter is required'), // Ensure at least one splitter
  })
  .superRefine((data, ctx) => {
    // Validate sum of payer amounts matches total amount
    if (data.payer.length > 0) {
      const totalPayerAmount = data.payer.reduce((total, p) => total + p.amount, 0);
      if (totalPayerAmount !== data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'The sum of payer amounts must equal the total amount',
          path: ['payer'], // Points to the payer field
        });
      }
    }

    // Validate sum of splitter amounts matches total amount
    if (data.splitter.length > 0) {
      const totalSplitterAmount = data.splitter.reduce((total, s) => total + s.amount, 0);
      if (totalSplitterAmount !== data.amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'The sum of splitter amounts must equal the total amount',
          path: ['splitter'], // Points to the splitter field
        });
      }
    }
  });

export { ExpenseSchema };
