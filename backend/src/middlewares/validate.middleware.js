export default function validate (schema) {
    return (req, res, next) => {
        const validationResult = schema.safeParse(req.body)

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed!',
                errors: validationResult.error.flatten().fieldErrors,
            })
        }

        req.body = validationResult.data
        next()
    }
}