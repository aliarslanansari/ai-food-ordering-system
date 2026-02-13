/**
 * Converts a Foods markdown file to JSON format
 * @param {string} markdownContent - The content of the Foods.md file
 * @returns {Array} Array of food items in JSON format
 */
function convertFoodsToJSON(markdownContent) {
  const lines = markdownContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const dishes = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip if this is a metadata line
    if (line.includes('Category:') || 
        line.match(/^(Calories|Protein|Carbs|Fat|Price):/) ||
        line.match(/^\d+g\s*\|/)) {
      i++;
      continue;
    }
    
    // Check if this is a dish name
    // Pattern 1: "Dish Name" followed by "Description:"
    // Pattern 2: "Dish Name" followed by "Dish Name Description:"
    let dishName = '';
    let description = '';
    
    if (i + 1 < lines.length && lines[i + 1].startsWith('Description:')) {
      // Pattern 1: Separate description line
      dishName = line;
      i++; // Move to Description line
      
    } else if (i + 1 < lines.length && lines[i + 1].includes('Description:')) {
      // Pattern 2: "Dish Name Description:" format
      dishName = line;
      i++; // Move to next line
      
    } else {
      i++;
      continue;
    }
    
    // Collect description lines
    let descriptionLines = [];
    while (i < lines.length && !lines[i].includes('Category:')) {
      const currentLine = lines[i];
      
      // Remove "Description:" or "DishName Description:" prefix
      if (currentLine.startsWith('Description:')) {
        descriptionLines.push(currentLine.replace('Description:', '').trim());
      } else if (currentLine.includes('Description:')) {
        // Handle "Dish Name Description:" format
        const parts = currentLine.split('Description:');
        if (parts.length > 1) {
          descriptionLines.push(parts[1].trim());
        }
      } else {
        descriptionLines.push(currentLine);
      }
      i++;
      
      // Break if we've hit the category line
      if (i < lines.length && lines[i].includes('Category:')) {
        break;
      }
    }
    
    description = descriptionLines.join(' ').trim();
    
    // Now collect metadata lines (Category, nutrition, price info)
    let metadataLines = [];
    while (i < lines.length && 
           (lines[i].includes('Category:') || 
            lines[i].includes('|') ||
            lines[i].match(/^(Calories|Protein|Carbs|Fat|Price):/))) {
      metadataLines.push(lines[i]);
      i++;
      
      // Break if we hit a new dish name (not a continuation of metadata)
      if (i < lines.length) {
        const nextLine = lines[i];
        if (!nextLine.includes('Category:') &&
            !nextLine.includes('|') &&
            !nextLine.match(/^(Calories|Protein|Carbs|Fat|Price):/) &&
            !nextLine.startsWith('Description:')) {
          // This might be a new dish
          break;
        }
      }
    }
    
    const metadataText = metadataLines.join(' ');
    
    // Parse metadata
    let category = '';
    let type = '';
    let spiceLevel = '';
    let ingredients = [];
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    let price = 0;
    let serves = 1;
    
    // Extract category
    const categoryMatch = metadataText.match(/Category:\s*([^|]+)/);
    if (categoryMatch) category = categoryMatch[1].trim();
    
    // Extract type
    const typeMatch = metadataText.match(/Type:\s*([^|]+)/);
    if (typeMatch) type = typeMatch[1].trim();
    
    // Extract spice level
    const spiceLevelMatch = metadataText.match(/Spice Level:\s*([^I]+?)\s*Ingredients:/);
    if (spiceLevelMatch) {
      spiceLevel = spiceLevelMatch[1].replace(/\|/g, '').trim();
    }
    
    // Extract ingredients
    const ingredientsMatch = metadataText.match(/Ingredients:\s*(.+?)Calories:/);
    if (ingredientsMatch) {
      ingredients = ingredientsMatch[1]
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);
    }
    
    // Extract nutrition info
    const caloriesMatch = metadataText.match(/Calories:\s*(\d+)/);
    if (caloriesMatch) calories = parseInt(caloriesMatch[1]);
    
    const proteinMatch = metadataText.match(/Protein:\s*(\d+)/);
    if (proteinMatch) protein = parseInt(proteinMatch[1]);
    
    const carbsMatch = metadataText.match(/Carbs:\s*(\d+)/);
    if (carbsMatch) carbs = parseInt(carbsMatch[1]);
    
    const fatMatch = metadataText.match(/Fat:\s*(\d+)/);
    if (fatMatch) fat = parseInt(fatMatch[1]);
    
    // Extract price
    const priceMatch = metadataText.match(/Price:\s*₹(\d+)/);
    if (priceMatch) price = parseInt(priceMatch[1]);
    
    // Extract serves
    const servesMatch = metadataText.match(/Serves:\s*(\d+)/);
    if (servesMatch) serves = parseInt(servesMatch[1]);
    
    // Create the dish object
    if (category && description && dishName) {
      // Create ID from dish name
      const id = dishName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      
      // Determine if vegetarian
      const isVegetarian = type.toLowerCase().includes('vegetarian') && 
                          !type.toLowerCase().includes('non-vegetarian');
      
      // Create image URL
      const imageUrl = `http://localhost:5200/assets/images/dishes/${id}`;
      
      dishes.push({
        id: id,
        name: dishName,
        description: description,
        category: category,
        type: type,
        spiceLevel: spiceLevel,
        ingredients: ingredients,
        nutrition: {
          calories: calories,
          protein: protein,
          carbs: carbs,
          fat: fat
        },
        price: price,
        serves: serves,
        isVegetarian: isVegetarian,
        image_url: imageUrl
      });
    }
  }
  
  return dishes;
}

// Example usage with Node.js:
// const fs = require('fs');
// const markdownContent = fs.readFileSync('Foods.md', 'utf8');
// const jsonData = convertFoodsToJSON(markdownContent);
// console.log(JSON.stringify(jsonData, null, 2));

// For browser or module export:
if (typeof module !== 'undefined' && module.exports) {
  module.exports = convertFoodsToJSON;
}


// Usage Example
const rawText = fs.readFileSync("./Foods.md", "utf8");
const result = convertFoodsToJSON(rawText);

fs.writeFileSync("./menu.json", JSON.stringify(result, null, 2));
console.log(`JSON file created successfully! Total dishes: ${result.length}`);
