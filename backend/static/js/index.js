// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwtToken'); // 确保 token 是从登录中获取并保存的

    // 确保 token 存在后再初始化 WordApp 实例
    if (token) {
        const wordApp = new WordApp(token); // 将 token 传递给 WordApp 实例
        wordApp.init();
    } else {
        console.error('No token found. Please log in first.');
        window.location.href = 'http://localhost:3000/login.html'; // 或者其他适当的处理
    }

    // Add event listener for the logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // 清除 token
            localStorage.removeItem('jwtToken');
            window.location.href = 'http://localhost:3000/login.html';
        });
    }
});

class WordApp {
    constructor(token) {
        this.token = token;
        this.words = [];
        this.techWords = [];
        this.dailyWords = [];
        this.showChineseWords = true;
        this.showGermanWords = false;
        this.shuffledWords = [];
        this.numberOfWords = document.getElementById('numberOfWords');
        this.wordList = document.getElementById('wordList');
        this.categoryShow = document.getElementById('categoryShow'); // 新增初始化
    }

    async fetchWords() {
        try {
            const response = await fetch('http://localhost:3000/api/words', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const data = await response.json();
            this.words = data;
            this.techWords = data.filter(word => word.categoryAdd === 'tech');
            this.dailyWords = data.filter(word => word.categoryAdd === 'daily');
            this.numberOfWords.innerHTML = this.words.length;
            this.displayWords(this.words); // 更新后显示所有单词
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }

    init() {
        this.fetchWords();
        if (this.categoryShow) {
            this.categoryShow.addEventListener('change', (event) => this.handleCategoryChange(event));
        }
        if (document.getElementById('btnChinese')) {
            document.getElementById('btnChinese').addEventListener('click', () => this.toggleChinese());
        }
        if (document.getElementById('btnGerman')) {
            document.getElementById('btnGerman').addEventListener('click', () => this.toggleGerman());
        }
        if (document.getElementById('addWordButton')) {
            document.getElementById('addWordButton').addEventListener('click', () => this.addWord());
        }
        if (document.getElementById('randomWordsForm')) {
            document.getElementById('randomWordsForm').addEventListener('submit', (event) => this.handleFormSubmit(event));
        }
        if (document.getElementById('searchButton')) {
            document.getElementById('searchButton').addEventListener('click', () => this.searchWords());
        }
    }

    // Handle category selection and update the displayed words
    handleCategoryChange(event) {
        const selectedCategory = event.target.value; // Get the selected category
        // Update words based on selected category
        if (selectedCategory === 'tech') {
            this.displayWords(this.techWords);
        } else if (selectedCategory === 'daily') {
            this.displayWords(this.dailyWords);
        } else {
            this.displayWords(this.words);
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
                    'Authorization': `Bearer ${this.token}` // Ensure the token is sent with the request
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
        const wordList = this.wordList;
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
            const response = await fetch(`http://localhost:3000/api/words/search?query=${query}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}` // Ensure the token is sent with the request
                }
            });
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

    // Delete a word and replace it with a random word of the same category
    async deleteWord(id, liElement) {
        try {
            const response = await fetch(`http://localhost:3000/api/words/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}` // Ensure the token is sent with the request
                }
            });

            if (response.status === 204) {
                // confirm the category of the deleted word, and find the remaining words in the same category
                const category = this.words.find(word => word._id === id).categoryAdd;
                const remainingWords = this.words.filter(word => word._id !== id);
                const remainingCategoryWords = remainingWords.filter(word => word.categoryAdd === category);

                // Randomly select a word from the same category that is not currently displayed
                const existingWordsText = Array.from(document.getElementById('wordList').children).map(li => li.firstChild.textContent);
                const newWordCandidates = remainingCategoryWords.filter(word => !existingWordsText.includes(`${word.chinese} - ${word.german}`));
                if (newWordCandidates.length > 0) {
                    const newWord = newWordCandidates[Math.floor(Math.random() * newWordCandidates.length)];

                    // Create a list item for the new word
                    const li = document.createElement('li');
                    if (this.showChineseWords && this.showGermanWords) {
                        li.textContent = `${newWord.chinese} - ${newWord.german}`;
                    } else if (this.showChineseWords) {
                        li.textContent = newWord.chinese;
                    } else if (this.showGermanWords) {
                        li.textContent = newWord.german;
                    }

                    // Create a delete button and add it to the new word item
                    const deleteButton = document.createElement('button');
                    deleteButton.setAttribute("type", "button")
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = (event) => {
                        this.deleteWord(newWord._id, li);
                    };
                    li.appendChild(deleteButton);

                    // Insert the new word item in place of the deleted word item
                    liElement.parentNode.replaceChild(li, liElement);
                } else {
                    // If there are no suitable new words, directly remove the deleted word item
                    liElement.parentNode.removeChild(liElement);
                }

                // Refresh the word list
                this.fetchWords();
            } else {
                console.error('Failed to delete word');
            }
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    }
}