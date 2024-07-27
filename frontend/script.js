/**
 * Function list:
 * Store words -- ok
 * Avoid storing duplicate words -- ok
 * Search for words -- ok
 * Randomly display words -- ok
 * Switch word categories 
 * Delete a word and automatically add a word 
 * multiple users managment 
 */

// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
    const wordApp = new WordApp();
    wordApp.init();  // Initialize the WordApp instance
});

class WordApp {
    constructor() {
        // Initialize variables to manage words and their categories
        this.words = []; // Array to store all words fetched from the server
        this.techWords = []; // Array to store technical words
        this.dailyWords = []; // Array to store daily words
        this.showChineseWords = true; // Boolean to control the display of Chinese words
        this.showGermanWords = false; // Boolean to control the display of German words
        this.shuffledWords = []; // Array to store shuffled words for random display
        this.numberOfWords = document.getElementById('numberOfWords'); // Element to display the number of words
        this.categoryShow = document.getElementById('categoryShow'); // Dropdown to select word category
    }

    // Initialize event listeners and fetch words from the server
    init() {
        this.fetchWords(); // Fetch initial list of words
        // Add event listeners for category selection, button clicks, and form submissions
        this.categoryShow.addEventListener('change', (event) => this.handleCategoryChange(event));
        document.getElementById('btnChinese').addEventListener('click', () => this.toggleChinese());
        document.getElementById('btnGerman').addEventListener('click', () => this.toggleGerman());
        document.getElementById('addWordButton').addEventListener('click', () => this.addWord());
        document.getElementById('randomWordsForm').addEventListener('submit', (event) => this.handleFormSubmit(event));
        document.getElementById('searchButton').addEventListener('click', () => this.searchWords());
    }

    // Fetch words from the server and categorize them
    async fetchWords() {
        try {
            const response = await fetch('http://localhost:3000/api/words'); // Fetch words from the API
            const data = await response.json(); // Parse the JSON response
            this.words = data; // Store all words
            // Separate words into categories
            this.techWords = data.filter(word => word.categoryAdd === 'tech');
            this.dailyWords = data.filter(word => word.categoryAdd === 'daily');
            this.numberOfWords.innerHTML = this.words.length; // Update the number of words display
        } catch (error) {
            console.error('Error fetching words:', error); // Log errors if fetching fails
        }
    }

    // Handle category selection and update the displayed words
    handleCategoryChange(event) {
        const selectedCategory = event.target.value; // Get the selected category
        // Update words based on selected category
        if (selectedCategory === 'tech') {
            this.words = this.techWords;
        } else if (selectedCategory === 'daily') {
            this.words = this.dailyWords;
        } else {
            this.words = this.words;
        }
        this.numberOfWords.innerHTML = this.words.length; // Update the number of words display
    }

    // Add a new word to the server and update the list of words
    async addWord() {
        const chinese = document.getElementById('chinese').value; // Get the Chinese word
        const german = document.getElementById('german').value; // Get the German word
        const categoryAdd = document.getElementById('categoryAdd').value; // Get the category

        // Validate input fields
        if (!chinese || !german || !categoryAdd) {
            alert('Missing required fields');
            return;
        }

        try {
            // Check if the word already exists
            const fetchResponse = await fetch('http://localhost:3000/api/words');
            const words = await fetchResponse.json();
            const duplicate = words.find(word => word.chinese === chinese && word.german === german);
            if (duplicate) {
                alert('The word already exists');
                return;
            }

            // Add the new word to the server
            const response = await fetch('http://localhost:3000/api/words', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chinese, german, categoryAdd }),
            });

            if (response.ok) {
                const data = await response.json();
                alert('Word added successfully');
                this.fetchWords(); // Refresh the word list
            } else {
                const errorData = await response.json();
                console.error('Error adding word:', errorData.error);
                alert('Error adding word: ' + errorData.error);
            }
        } catch (error) {
            console.error('Error adding word:', error);
            alert('Error adding word: ' + error.message);
        }
    }

    // Display the list of words based on the current display settings
    displayWords(wordsToDisplay) {
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = ''; // Clear the existing word list

        wordsToDisplay.forEach(word => {
            const li = document.createElement('li');
            // Display words based on current settings
            if (this.showChineseWords && this.showGermanWords) {
                li.textContent = `${word.chinese} - ${word.german}`;
            } else if (this.showChineseWords) {
                li.textContent = word.chinese;
            } else if (this.showGermanWords) {
                li.textContent = word.german;
            } else {
                return;
            }
            // Create and append delete button
            const deleteButton = document.createElement('button');
            deleteButton.setAttribute("type", "button")
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = (event) => {
                this.deleteWord(word._id, li); // Delete the word when button is clicked
            };
            li.appendChild(deleteButton);
            wordList.appendChild(li);
        });
    }

    // Toggle the visibility of Chinese words
    toggleChinese() {
        this.showChineseWords = !this.showChineseWords;
        document.getElementById('btnChinese').textContent = this.showChineseWords ? 'Hide Chinese' : 'Show Chinese';
        this.displayWords(this.shuffledWords); // Refresh displayed words
    }

    // Toggle the visibility of German words
    toggleGerman() {
        this.showGermanWords = !this.showGermanWords;
        document.getElementById('btnGerman').textContent = this.showGermanWords ? 'Hide German' : 'Show German';
        this.displayWords(this.shuffledWords); // Refresh displayed words
    }

    // Handle form submission to display a random set of words
    handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission behavior
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput.value); // Get the desired number of words

        // Validate quantity input
        if (isNaN(quantity)) {
            alert('Please enter a valid number.');
            return;
        }

        if (quantity <= 0) {
            alert('Please enter a number greater than zero.');
            return;
        }

        if (quantity > this.words.length) {
            alert(`There are only ${this.words.length} words available.`);
            return;
        }

        // Shuffle words and display a subset
        this.shuffledWords = [...this.words].sort(() => 0.5 - Math.random()).slice(0, quantity);
        this.displayWords(this.shuffledWords);
    }

    // Search for words based on a query and display results
    async searchWords() {
        const query = document.getElementById('searchQuery').value.trim(); // Get the search query

        if (!query) {
            this.displaySearchResults([]);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/words/search?query=${query}`);
            if (!response.ok) {
                console.error('Search failed:', response.statusText);
                return;
            }

            const words = await response.json();
            this.displaySearchResults(words); // Display search results
        } catch (error) {
            console.error('Error searching words:', error);
        }
    }

    // Display search results in the UI
    displaySearchResults(words) {
        const resultsList = document.getElementById('searchResults');
        resultsList.innerHTML = ''; // Clear existing results

        if (words.length === 0) {
            resultsList.innerHTML = '<li>No words found</li>';
            return;
        }

        words.forEach(word => {
            const listItem = document.createElement('li');
            listItem.innerText = `${word.chinese} - ${word.german}`;
            resultsList.appendChild(listItem);
        });
    }

    // Delete a word from the server and update the word list
    async deleteWord(id, liElement) {
        try {
            const response = await fetch(`http://localhost:3000/api/words/${id}`, {
                method: 'DELETE',
            });

            if (response.status === 204) {
                liElement.parentNode.removeChild(liElement); // Remove the word from the UI
                this.fetchWords(); // Refresh the word list
            } else {
                console.error('Failed to delete word');
            }
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    }
}