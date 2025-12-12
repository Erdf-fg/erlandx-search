"""
Instant Answers Module
Provides instant answers for calculationsunit conversions, and quick facts.
"""

import re
import math
from typing import Optional, Dict, Any


class InstantAnswers:
    def __init__(self):
        # Unit conversion rates (to base unit)
        self.distance_units = {
            'km': 1000, 'kilometer': 1000, 'kilometers': 1000,
            'm': 1, 'meter': 1, 'meters': 1,
            'mi': 1609.34, 'mile': 1609.34, 'miles': 1609.34,
            'ft': 0.3048, 'foot': 0.3048, 'feet': 0.3048,
            'in': 0.0254, 'inch': 0.0254, 'inches': 0.0254,
            'cm': 0.01, 'centimeter': 0.01, 'centimeters': 0.01,
        }
        
        self.weight_units = {
            'kg': 1, 'kilogram': 1, 'kilograms': 1,
            'g': 0.001, 'gram': 0.001, 'grams': 0.001,
            'lb': 0.453592, 'pound': 0.453592, 'pounds': 0.453592,
            'oz': 0.0283495, 'ounce': 0.0283495, 'ounces': 0.0283495,
        }
    
    def get_answer(self, query: str) -> Optional[Dict[str, Any]]:
        """Get instant answer for query if applicable."""
        query = query.strip()
        
        # Try calculator
        calc_result = self._try_calculator(query)
        if calc_result:
            return calc_result
        
        # Try unit converter
        conv_result = self._try_unit_converter(query)
        if conv_result:
            return conv_result
        
        # Try temperature converter
        temp_result = self._try_temperature(query)
        if temp_result:
            return temp_result
        
        return None
    
    def _try_calculator(self, query: str) -> Optional[Dict[str, Any]]:
        """Try to evaluate as math expression."""
        # Pattern: numbers and math operators
        math_pattern = r'^[\d\s+\-*/().sqrt()^%]+$'
        
        # Replace common math terms
        calc_query = query.lower()
        calc_query = calc_query.replace('sqrt', 'math.sqrt')
        calc_query = calc_query.replace('^', '**')
        calc_query = calc_query.replace('×', '*')
        calc_query = calc_query.replace('÷', '/')
        
        # Check if looks like math
        if not re.match(r'.*[\d]\s*[\+\-\*/\(\)\^].+[\d].*', query):
            return None
        
        try:
            # Safe eval with limited scope
            result = eval(calc_query, {"__builtins__": {}, "math": math})
            
            # Format result
            if isinstance(result, float):
                if result.is_integer():
                    result = int(result)
                else:
                    result = round(result, 6)
            
            return {
                'type': 'calculator',
                'query': query,
                'result': str(result),
                'formula': query
            }
        except Exception:
            return None
    
    def _try_unit_converter(self, query: str) -> Optional[Dict[str, Any]]:
        """Try to convert units (distance, weight)."""
        # Pattern: number unit to unit
        pattern = r'(\d+(?:\.\d+)?)\s*([a-z]+)\s+(?:to|in)\s+([a-z]+)'
        match = re.search(pattern, query.lower())
        
        if not match:
            return None
        
        value = float(match.group(1))
        from_unit = match.group(2)
        to_unit = match.group(3)
        
        # Try distance conversion
        if from_unit in self.distance_units and to_unit in self.distance_units:
            # Convert to meters, then to target
            meters = value * self.distance_units[from_unit]
            result = meters / self.distance_units[to_unit]
            
            return {
                'type': 'converter',
                'category': 'distance',
                'from_value': value,
                'from_unit': from_unit,
                'to_value': round(result, 4),
                'to_unit': to_unit,
                'formula': f"{value} {from_unit} = {round(result, 4)} {to_unit}"
            }
        
        # Try weight conversion
        if from_unit in self.weight_units and to_unit in self.weight_units:
            # Convert to kg, then to target
            kg = value * self.weight_units[from_unit]
            result = kg / self.weight_units[to_unit]
            
            return {
                'type': 'converter',
                'category': 'weight',
                'from_value': value,
                'from_unit': from_unit,
                'to_value': round(result, 4),
                'to_unit': to_unit,
                'formula': f"{value} {from_unit} = {round(result, 4)} {to_unit}"
            }
        
        return None
    
    def _try_temperature(self, query: str) -> Optional[Dict[str, Any]]:
        """Convert temperature units."""
        # Pattern: number c/f to c/f
        pattern = r'(\d+(?:\.\d+)?)\s*([cf])\s+(?:to|in)\s+([cf])'
        match = re.search(pattern, query.lower())
        
        if not match:
            return None
        
        value = float(match.group(1))
        from_unit = match.group(2).upper()
        to_unit = match.group(3).upper()
        
        if from_unit == to_unit:
            return None
        
        # Convert
        if from_unit == 'C' and to_unit == 'F':
            result = (value * 9/5) + 32
        elif from_unit == 'F' and to_unit == 'C':
            result = (value - 32) * 5/9
        else:
            return None
        
        return {
            'type': 'converter',
            'category': 'temperature',
            'from_value': value,
            'from_unit': f'°{from_unit}',
            'to_value': round(result, 2),
            'to_unit': f'°{to_unit}',
            'formula': f"{value}°{from_unit} = {round(result, 2)}°{to_unit}"
        }


# Global instance
instant_answers = InstantAnswers()
