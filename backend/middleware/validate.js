const validate = (schema) => async (req, res, next) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    
    const validationErrors = error.issues || error.errors;

    if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
      return res.status(400).json({
        message: validationErrors[0].message 
      });
    }
    
    return res.status(400).json({
      message: error.message || "An error occurred while verifying the data."
    });
  }
};

module.exports = validate;