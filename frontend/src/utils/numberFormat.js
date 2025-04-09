export const formatIndianNumber = (num) => {
  const numStr = num.toFixed(2);
  const [wholePart, decimal] = numStr.split('.');
  const lastThree = wholePart.slice(-3);
  const otherNumbers = wholePart.slice(0, -3);
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${otherNumbers ? formatted + ',' + lastThree : lastThree}${decimal ? '.' + decimal : ''}`;
};