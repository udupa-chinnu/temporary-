import re
import os

# Sample documents to be searched
documents = {
    "doc1.txt": "The quick brown fox jumps over the lazy dog.",
    "doc2.txt": "A journey of a thousand miles begins with a single step.",
    "doc3.txt": "To be or not to be, that is the question.",
    "doc4.txt": "All that glitters is not gold."
}

# Function to perform regex search on documents
def regex_search(query, documents):
    results = {}
    
    for filename, content in documents.items():
        matches = re.findall(query, content)
        if matches:
            results[filename] = matches
    
    return results

# Function to display the search results
def display_results(results):
    if not results:
        print("No matches found.")
    else:
        for filename, matches in results.items():
            print(f"\nMatches in {filename}:")
            for match in matches:
                print(f" - {match}")

# Function for user input and search logic
def search_engine():
    print("Welcome to the Regex-Based Search Engine!")
    print("Available documents: doc1.txt, doc2.txt, doc3.txt, doc4.txt")
    
    while True:
        query = input("\nEnter a regular expression to search (or type 'exit' to quit): ").strip()
        
        if query.lower() == "exit":
            print("Exiting search engine...")
            break
        
        try:
            # Perform the search
            print(f"\nSearching for: {query}")
            results = regex_search(query, documents)
            
            # Display the search results
            display_results(results)
        
        except re.error:
            print("Invalid regular expression. Please try again with a valid pattern.")

# Run the search engine
if __name__ == "__main__":
    search_engine()
