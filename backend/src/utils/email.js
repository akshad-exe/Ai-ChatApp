

const generateResetUrl = async (email, resetToken) => {
  // Generate reset URL
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  console.log('Reset URL generated:', resetUrl);
  
  return {
    success: true,
    resetUrl
  };
};

module.exports = {
  generateResetUrl
}; 