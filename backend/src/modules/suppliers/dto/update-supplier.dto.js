import { z } from "zod"

export const updateSupplierDto = z.object({
    name: z
        .string({
            invalid_type_error: 
                "Supplier name must be a string"
        })
        .trim()
        .min(
            2, 
            "Supplier name must be at least 2 characters"
        )
        .max(
            150, 
            "Supplier name cannot exceed 150 characters"
        )
        .optional(),

    contactPerson: z
        .string({
            invalid_type_error: 
                "Contact person name must be a string" 
        })
        .trim()
        .max(
            100, 
            "Contact person name cannot exceed 100 characters"
        )
        .optional(),
    
    phone: z
        .string({
            invalid_type_error: 
                "Supplier phone number must be a string"
        })
        .trim()
        .max(
            20, 
            "Phone number cannot exceed 20 characters"
        )
        .optional(),
    email: z
        .string({
            invalid_type_error: 
                "Supplier email must be a string"
        })
        .trim()
        .email("Please provide a valid supplier email")
        .max(
            150, 
            "Supplier email cannot exceed 150 characters"
        )
        .optional(),

    address: z
        .string({
            invalid_type_error: 
                "Supplier address must be a string"
        })
        .trim()
        .max(
            300, 
            "Supplier address cannot exceed 300 characters"
        )
        .optional(),
    
    notes: z
        .string({
            invalid_type_error: 
                "Supplier notes must be a string"
        })
        .trim()
        .max(
            500, 
            "Supplier notes cannot exceed 500 characters"
        )
        .optional(),
    
    status: z
        .enum(["ACTIVE", "INACTIVE"], { 
            invalid_type_error: 
                "Invalid supplier status specified"
        })
        .optional()
})
.strict()
