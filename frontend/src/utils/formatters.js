/**
 * Formatuje cenę do polskiego formatu walutowego
 * @param {Number} price - Cena do sformatowania
 * @returns {String} - Sformatowana cena w PLN
 */
const formatPrice = (price) => {
    if (price === undefined || price === null) {
      return 'Brak danych';
    }
    
    // Formatowanie liczby do formatu z separatorem tysięcy
    const formattedPrice = new Intl.NumberFormat('pl-PL', {
      maximumFractionDigits: 0
    }).format(price);
    
    return `${formattedPrice} zł`;
  };
  
  /**
   * Formatuje przebieg do formatu z separatorem tysięcy i dopiskiem km
   * @param {Number} mileage - Przebieg do sformatowania
   * @returns {String} - Sformatowany przebieg
   */
  const formatMileage = (mileage) => {
    if (mileage === undefined || mileage === null) {
      return 'Brak danych';
    }
    
    // Formatowanie liczby do formatu z separatorem tysięcy
    const formattedMileage = new Intl.NumberFormat('pl-PL', {
      maximumFractionDigits: 0
    }).format(mileage);
    
    return `${formattedMileage} km`;
  };
  
  export { formatPrice, formatMileage };