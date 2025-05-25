import { collection, getDocs, limit, or, query, where } from "firebase/firestore";

export const useProductSearch = () => {
  const db = useFirestore();

  const searchProducts = async (term: string) => {
    const cleanedTerm = term.trim().toLowerCase();

    if (!cleanedTerm) return [];

    // Split the search term into individual words
    const searchWords = cleanedTerm.split(/\s+/).filter((word) => word.length > 1);

    if (searchWords.length === 0) return [];

    // Create an array to hold our query conditions
    let queries = [];

    // Search for the full term in the searchKeywords array
    queries.push(where("searchKeywords", "array-contains", cleanedTerm));

    // Also try to search for individual words
    for (const word of searchWords) {
      if (word.length > 2) {
        // Only search for words with 3+ characters
        queries.push(where("searchKeywords", "array-contains", word));
      }
    }

    // Create a composite query using 'or'
    const productsQuery = query(collection(db, "products"), or(...queries), limit(20));

    // Execute the query
    const snapshot = await getDocs(productsQuery);

    // Process results with relevance scoring
    const results = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Calculate a simple relevance score
      let relevanceScore = 0;

      // Check if the full search term appears in the name (highest relevance)
      if (data.name?.toLowerCase().includes(cleanedTerm)) {
        relevanceScore += 10;
      }

      // Check if individual words appear in the name
      for (const word of searchWords) {
        if (data.name?.toLowerCase().includes(word)) {
          relevanceScore += 5;
        }
      }

      // Check exact keyword matches
      if (data.searchKeywords?.includes(cleanedTerm)) {
        relevanceScore += 8;
      }

      // Check individual word matches in keywords
      for (const word of searchWords) {
        if (data.searchKeywords?.includes(word)) {
          relevanceScore += 3;
        }
      }

      return {
        id: doc.id,
        ...data,
        relevanceScore,
      };
    });

    // Sort by relevance score
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  // Simple function to generate search keywords from just the product name
  // This matches your existing structure
  const generateSearchKeywords = (productName: string): string[] => {
    if (!productName) return [];

    const keywords = new Set<string>();
    const fullName = productName.toLowerCase();

    // Add the full product name
    keywords.add(fullName);

    // Add individual words
    const words = fullName.split(/\s+/).filter((word) => word.length > 1);
    words.forEach((word) => keywords.add(word));

    return Array.from(keywords);
  };

  return { searchProducts, generateSearchKeywords };
};
