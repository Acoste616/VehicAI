// Plik: src/components/AITips.jsx
// Komponent wyświetlający automatyczne rekomendacje AI na podstawie danych pojazdu

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const AITips = ({ year, mileage, visualCondition, warranty, inspectionValidUntil }) => {
  // Generuj wskazówki AI na podstawie przekazanych danych
  const tips = useMemo(() => {
    const recommendations = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Oblicz wiek pojazdu
    const vehicleAge = currentYear - year;
    
    // Sprawdź przegląd techniczny
    if (inspectionValidUntil) {
      const inspectionDate = inspectionValidUntil.toDate ? inspectionValidUntil.toDate() : new Date(inspectionValidUntil);
      
      if (inspectionDate < currentDate) {
        recommendations.push('📅 Przegląd techniczny nieaktualny – zapytaj sprzedawcę o aktualny stan');
      } else {
        // Sprawdź, czy przegląd jest ważny przez jeszcze przynajmniej 6 miesięcy
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(currentDate.getMonth() + 6);
        
        if (inspectionDate < sixMonthsFromNow) {
          recommendations.push('📅 Przegląd techniczny wkrótce wygasa – warto uwzględnić koszt nowego');
        } else {
          recommendations.push('✅ Przegląd techniczny ważny przez dłuższy czas – to dobry znak');
        }
      }
    }
    
    // Sprawdź przebieg
    if (mileage) {
      if (mileage > 200000) {
        recommendations.push('⚠️ Wysoki przebieg – warto zabrać mechanika na oględziny');
      } else if (mileage > 150000) {
        recommendations.push('ℹ️ Przebieg powyżej średniej – sprawdź historię serwisową');
      } else if (mileage < 50000 && vehicleAge > 5) {
        recommendations.push('⚠️ Niski przebieg w stosunku do wieku – zweryfikuj autentyczność przebiegu');
      } else if (mileage < 100000 && vehicleAge < 5) {
        recommendations.push('✅ Optymalny przebieg w stosunku do wieku pojazdu');
      }
    }
    
    // Sprawdź gwarancję
    if (warranty === false) {
      recommendations.push('ℹ️ Brak gwarancji – rozważ dodatkowe ubezpieczenie');
    } else if (warranty === true) {
      recommendations.push('✅ Pojazd objęty gwarancją – dodatkowe bezpieczeństwo zakupu');
    }
    
    // Sprawdź ocenę wizualną
    if (visualCondition) {
      if (visualCondition <= 2) {
        recommendations.push('🛠️ Ocena wizualna niska – możliwa konieczność napraw kosmetycznych');
      } else if (visualCondition >= 4) {
        recommendations.push('✅ Dobra ocena wizualna – pojazd zadbany');
      }
    }
    
    // Ogólna ocena stanu pojazdu
    if (visualCondition >= 4 && warranty && mileage < 100000 && vehicleAge < 5) {
      recommendations.push('✅ Auto w bardzo dobrym stanie – gotowe do jazdy');
    } else if (visualCondition <= 2 && mileage > 150000 && vehicleAge > 8) {
      recommendations.push('⚠️ Pojazd wymaga uwagi – rozważ negocjację ceny');
    }
    
    // Wiek pojazdu
    if (vehicleAge > 10) {
      recommendations.push('⏱️ Pojazd ma ponad 10 lat – może wymagać większych nakładów na utrzymanie');
    } else if (vehicleAge < 3 && warranty) {
      recommendations.push('✅ Relatywnie nowy pojazd na gwarancji – dobry wybór');
    }
    
    return recommendations;
  }, [year, mileage, visualCondition, warranty, inspectionValidUntil]);

  // Jeśli nie ma żadnych rekomendacji, nie renderuj niczego
  if (tips.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-800 flex items-center">
        🧠 AI doradza
      </h2>
      <ul className="space-y-2">
        {tips.map((tip, index) => (
          <li key={index} className="text-blue-700">
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Definicja typów props
AITips.propTypes = {
  year: PropTypes.number,
  mileage: PropTypes.number,
  visualCondition: PropTypes.number,
  warranty: PropTypes.bool,
  inspectionValidUntil: PropTypes.object // Timestamp z Firebase
};

export default AITips;