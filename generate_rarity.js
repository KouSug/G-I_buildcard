
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'src', 'data', 'enka_characters.json');
const outputFile = path.join(__dirname, 'src', 'data', 'rarityData.json');

try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const characters = JSON.parse(rawData);

    const rarityMap = {};
    Object.keys(characters).forEach(id => {
        const char = characters[id];
        if (char.QualityType) {
            rarityMap[id] = char.QualityType;
        }
    });

    fs.writeFileSync(outputFile, JSON.stringify(rarityMap, null, 2));
    console.log(`Successfully created rarityData.json with ${Object.keys(rarityMap).length} entries.`);

    // Clean up
    fs.unlinkSync(inputFile);
    console.log('Deleted temporary file enka_characters.json');

} catch (error) {
    console.error('Error processing rarity data:', error);
    process.exit(1);
}
