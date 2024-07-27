document.addEventListener('DOMContentLoaded', (event) => {
    const wordApp = new WordApp();
    wordApp.init();
});

class WordApp {
    constructor() {
        this.words = [];
        this.techWords = [];
        this.dailyWords = [];
        this.showChineseWords = true;
        this.showGermanWords = false;
        this.shuffledWords = [];
        this.numberOfWords = document.getElementById('numberOfWords');
        this.categoryShow = document.getElementById('categoryShow');
    }

    init() {
        this.fetchWords();
        this.categoryShow.addEventListener('change', (event) => this.handleCategoryChange(event));
        document.getElementById('btnChinese').addEventListener('click', () => this.toggleChinese());
        document.getElementById('btnGerman').addEventListener('click', () => this.toggleGerman());
        document.getElementById('addWordButton').addEventListener('click', () => this.addWord());
        document.getElementById('randomWordsForm').addEventListener('submit', (event) => this.handleFormSubmit(event));
        document.getElementById('searchButton').addEventListener('click', () => this.searchWords());
    }

    async fetchWords() {
        try {
            const response = await fetch('http://localhost:3000/api/words');
            const data = await response.json();
            this.words = data;
            this.techWords = data.filter(word => word.categoryAdd === 'tech');
            this.dailyWords = data.filter(word => word.categoryAdd === 'daily');
            this.numberOfWords.innerHTML = this.words.length;
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }

    handleCategoryChange(event) {
        const selectedCategory = event.target.value;
        if (selectedCategory === 'tech') {
            this.words = this.techWords;
        } else if (selectedCategory === 'daily') {
            this.words = this.dailyWords;
        } else {
            this.words = this.words;
        }
        this.numberOfWords.innerHTML = this.words.length;
    }

    async addWord() {
        const chinese = document.getElementById('chinese').value;
        const german = document.getElementById('german').value;
        const categoryAdd = document.getElementById('categoryAdd').value;

        if (!chinese || !german || !categoryAdd) {
            alert('Missing required fields');
            return;
        }

        try {
            const fetchResponse = await fetch('http://localhost:3000/api/words');
            const words = await fetchResponse.json();
            const duplicate = words.find(word => word.chinese === chinese && word.german === german);
            if (duplicate) {
                alert('The word already exists');
                return;
            }

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
                this.fetchWords();
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

    displayWords(wordsToDisplay) {
        const wordList = document.getElementById('wordList');
        wordList.innerHTML = '';

        wordsToDisplay.forEach(word => {
            const li = document.createElement('li');
            if (this.showChineseWords && this.showGermanWords) {
                li.textContent = `${word.chinese} - ${word.german}`;
            } else if (this.showChineseWords) {
                li.textContent = word.chinese;
            } else if (this.showGermanWords) {
                li.textContent = word.german;
            } else {
                return;
            }
            const deleteButton = document.createElement('button');
            deleteButton.setAttribute("type", "button")
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = (event) => {
                this.deleteWord(word._id, li);
            };
            li.appendChild(deleteButton);
            wordList.appendChild(li);
        });
    }

    toggleChinese() {
        this.showChineseWords = !this.showChineseWords;
        document.getElementById('btnChinese').textContent = this.showChineseWords ? 'Hide Chinese' : 'Show Chinese';
        this.displayWords(this.shuffledWords);
    }

    toggleGerman() {
        this.showGermanWords = !this.showGermanWords;
        document.getElementById('btnGerman').textContent = this.showGermanWords ? 'Hide German' : 'Show German';
        this.displayWords(this.shuffledWords);
    }

    handleFormSubmit(event) {
        event.preventDefault();
        const quantityInput = document.getElementById('quantity');
        const quantity = parseInt(quantityInput.value);

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

        this.shuffledWords = [...this.words].sort(() => 0.5 - Math.random()).slice(0, quantity);
        this.displayWords(this.shuffledWords);
    }

    async searchWords() {
        const query = document.getElementById('searchQuery').value.trim();

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
            this.displaySearchResults(words);
        } catch (error) {
            console.error('Error searching words:', error);
        }
    }

    displaySearchResults(words) {
        const resultsList = document.getElementById('searchResults');
        resultsList.innerHTML = '';

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

    async deleteWord(id, liElement) {
        try {
            const response = await fetch(`http://localhost:3000/api/words/${id}`, {
                method: 'DELETE',
            });

            if (response.status === 204) {
                liElement.parentNode.removeChild(liElement);
                this.fetchWords();
            } else {
                console.error('Failed to delete word');
            }
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    }
}