// Initialize the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const userData = new WordApp
    userData.init()
    // Display username in the span
    const usernameElement = document.getElementById('username');
    const username = localStorage.getItem('username');
    if (username) {
        usernameElement.textContent = username;
        // localStorage.removeItem('username');
    }

    // Add event listener for the logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function () {
            try {
                const res = await fetch('/api/logout', {
                    method: 'post',
                    credentials: 'include'
                })
                if (res.ok) {
                    window.location.href = `/login.html`;
                } else {
                    console.log('Logout failed')
                }
            } catch (error) {
                console.error('Error during logout', error)
            }
        });
    }
});

/* 
functions in WordApp class:
- fetchWords: Fetch words from the server
- init: Initialize the application
- resetWord: Reset the review status of a word
- clearRandomResult: Clear the random word result
- clearSearchResult: Clear the search result
- handleCategoryChange: Handle category selection and update the displayed words
- addWord: Add a new word to the server and update the list of words
- displayWords: Display the list of words based on the current display settings
- togglemotherLanguage: Toggle the visibility of motherLanguage words
- toggleGerman: Toggle the visibility of German words
- handleFormSubmit: Handle form submission to display a random set of words
- displaySearchResults: Display search results
- debouncedDisplaySuggestions: Debounced function to display suggestions
- displaySuggestions: Display search suggestions
- clearSuggestions: Clear the search suggestions
- handleKeyDown: Handle keydown events for search suggestions
- highlightSuggestion: Highlight the selected suggestion
- updateWordCategory: Update the category of a word
- deleteWord: Delete a word and replace it with a random word of the same category
- setReview: Set the review status of a word
 */

class WordApp {
    constructor() {
        this.words = [];
        this.shuffledWords = [];
        this.selectedIndex = -1;
        this.suggestions = [];
        this.currentCategory = 'all'; // Initialize the current category. An value must be given!
        this.showmotherLanguageWords = true;
        this.showGermanWords = false;
        this.noHoverActive = false; // 用于判断是否使用键盘选择
        this.numberOfWords = document.getElementById('numberOfWords');
        this.wordList = document.getElementById('wordList');
        this.mainCategory = document.getElementById('mainCategory');
        this.subCategory = document.getElementById('subCategory');
    }

    async fetchWords() {
        try {
            const response = await fetch(`/api/words`, {
                credentials: 'include', // 确保包含 httpOnly cookie
            });
            const data = await response.json();
            this.words = data;
            this.handleCategoryChange()
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }

    init() {
        this.fetchWords();
        // Add event listeners
        this.mainCategory.addEventListener('change', () => this.handleCategoryChange('change'));
        this.subCategory.addEventListener('change', () => this.handleCategoryChange('change'));
        document.getElementById('btnmotherLanguage').addEventListener('click', () => this.togglemotherLanguage());
        document.getElementById('btnGerman').addEventListener('click', () => this.toggleGerman());
        document.getElementById('addWordButton').addEventListener('click', () => this.addWord());
        document.getElementById('randomWordsForm').addEventListener('submit', (event) => this.handleFormSubmit(event));
        document.getElementById('searchQuery').addEventListener('input', () => this.debouncedDisplaySuggestions());
        document.getElementById('clearButton_1').addEventListener('click', () => this.clearSearchResult());
        document.getElementById('clearButton_2').addEventListener('click', (event) => this.clearRandomResult(event));
        document.getElementById('searchQuery').addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.getElementById('suggestions').addEventListener('mousemove', () => this.handleMouseMove());
    }

    
    async resetWord(id, liElement) {
        // 先在本地设置单词的 review 状态
        const word = this.words.find(word => word._id === id);
        if (word) {
            word.review = false;
            liElement.remove();
            // 更新 UI
            this.handleCategoryChange();
            try {
                const response = await fetch(`/api/words/${id}/review`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ review: false }),
                    credentials: 'include' // 确保包含 httpOnly cookie
                });

                if (response.ok) {
                    console.log('Review status updated successfully');


                } else {
                    const errorText = await response.text();
                    console.error(`Failed to update review status: ${errorText}`);
                }
            } catch (error) {
                console.error('Error updating review status:', error);
            }
        } else {
            console.error('Word not found in local data');
        }
    }

    clearRandomResult(event) {
        document.getElementById('quantity').focus()
        event.preventDefault();
        this.wordList.innerHTML = ''
    }

    clearSearchResult() {
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchQuery').value = '';
        document.getElementById('suggestions').innerHTML = '';
        document.getElementById('suggestions').style.border = '0'
    }

    // Handle category selection and update the displayed words
    handleCategoryChange(method) {
        this.currentCategory = this.mainCategory.value; // Update the current category

        const subCategoryValue = this.subCategory.value;

        // Define the filter conditions based on the current category and sub-category
        const filters = {
            all: {
                tech: word => word.categoryAdd === 'tech',
                daily: word => word.categoryAdd === 'daily',
                all: () => true
            },
            review: {
                tech: word => word.review === true && word.categoryAdd === 'tech',
                daily: word => word.review === true && word.categoryAdd === 'daily',
                all: word => word.review === true
            },
            unfamiliar: {
                tech: word => word.review === false && word.categoryAdd === 'tech',
                daily: word => word.review === false && word.categoryAdd === 'daily',
                all: word => word.review === false
            }
        };

        // Get the filter function for the current category and sub-category
        const filterFunction = filters[this.currentCategory][subCategoryValue]
        // Filter the words based on the selected filter function
        const categoryWords = this.words.filter(filterFunction);
        if (method === 'change' || method === 'submit') {
            this.wordList.innerHTML = ''
        }
        this.numberOfWords.innerText = categoryWords.length
        return categoryWords;
    }

    // Add a new word to the server and update the list of words
    async addWord() {
        let motherLanguage = document.getElementById('motherLanguage').value.trim();
        let german = document.getElementById('german').value.trim();
        let categoryAdd = document.getElementById('categoryAdd').value.trim();
    
        if (!motherLanguage || !german || !categoryAdd) {
            alert('Missing required fields');
            return;
        }
    
        try {
            const response = await fetch(`/api/words`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ motherLanguage, german, categoryAdd }),
                credentials: 'include'
            });
    
            const errorData = await response.json();
            if (!response.ok) {
                alert(`Error adding word: ${errorData.message || 'Unknown error'}`);
                return;
            }
    
            alert('Word added successfully');
            document.getElementById('motherLanguage').value = '';
            document.getElementById('german').value = '';
            this.fetchWords();
        } catch (error) {
            console.error('Error adding word:', error);
            alert('Error adding word: ' + error.message);
        }
    }

    // Display the list of words based on the current display settings
    displayWords(wordsToDisplay) {
        console.log('to display words')
        const wordList = this.wordList;
        console.log('wordsToDisplay is:', wordsToDisplay)
        wordList.innerHTML = ''; // Clear the existing word list

        wordsToDisplay.forEach(word => {
            console.log
            const li = document.createElement('li');
            // Display words based on current settings
            if (this.showmotherLanguageWords && this.showGermanWords) {
                li.textContent = `${word.motherLanguage} - ${word.german}`;
            } else if (this.showmotherLanguageWords) {
                li.textContent = word.motherLanguage;
            } else if (this.showGermanWords) {
                li.textContent = word.german;
            } else {
                return;
            }
            // Create and append delete button if this.mainCategory.value is 'review'
            if (this.mainCategory.value === 'review') {
                const deleteButton = document.createElement('button');
                deleteButton.setAttribute("type", "button")
                deleteButton.textContent = 'Delete';
                deleteButton.onclick = (event) => {
                    this.deleteWord(word._id, li); // Delete the word when button is clicked
                };
                li.appendChild(deleteButton);

                const resetBtn = document.createElement('button');
                resetBtn.setAttribute('type', 'button')
                resetBtn.textContent = 'Reset'
                resetBtn.addEventListener('click', () => { this.resetWord(word._id, li) })
                li.appendChild(resetBtn);
            }
            // Create and append review button if this.mainCategory.value is 'unfamiliar'
            if (this.mainCategory.value === 'unfamiliar') {
                const reviewButton = document.createElement('button');
                reviewButton.setAttribute("type", "button")
                reviewButton.textContent = 'setReview';
                reviewButton.onclick = (event) => {
                    this.setReview(word._id, li); // call setReview function when button is clicked
                };
                li.appendChild(reviewButton);
            }
            wordList.appendChild(li);
        });
    }

    // Toggle the visibility of motherLanguage words
    togglemotherLanguage() {
        this.showmotherLanguageWords = !this.showmotherLanguageWords;
        document.getElementById('btnmotherLanguage').textContent = this.showmotherLanguageWords ? 'Hide motherLanguage' : 'Show motherLanguage';
        this.displayWords(this.shuffledWords); // Refresh displayed words
    }

    // Toggle the visibility of German words
    toggleGerman() {
        this.showGermanWords = !this.showGermanWords;
        document.getElementById('btnGerman').textContent = this.showGermanWords ? 'Hide foreign language' : 'Show foreign language';
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
        
        if (quantity > Number(this.numberOfWords.textContent)) {
            alert(`There are only ${this.numberOfWords.textContent} words available.`);
            return;
        }
        
        // Shuffle words and display a subset
        this.shuffledWords = this.handleCategoryChange('submit').sort(() => 0.5 - Math.random()).slice(0, quantity);
        this.displayWords(this.shuffledWords);
        // Clear the input field after displaying the words
        quantityInput.value = '';
        quantityInput.focus()
        console.log('quantity is', quantity)
    }


    displaySearchResults(word) {
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = ''; // 清空结果容器

        const listItem = document.createElement('li');
        listItem.innerText = `${word.motherLanguage} - ${word.german}`;

        // 添加 category 选择框
        const categorySelect = document.createElement('select');
        categorySelect.innerHTML = `
                <option value="tech" ${word.categoryAdd === 'tech' ? 'selected' : ''}>Technical Words</option>
                <option value="daily" ${word.categoryAdd === 'daily' ? 'selected' : ''}>Daily Words</option>
            `;
        categorySelect.addEventListener('change', async (event) => {
            const newCategory = event.target.value;
            console.log('Selected new category:', newCategory); // 添加调试日志

            await this.updateWordCategory(word._id, newCategory);
        });
        listItem.appendChild(categorySelect);

        // 添加删除按钮
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', () => {
            this.deleteWord(word._id, listItem);
        });
        listItem.appendChild(deleteButton);

        resultsContainer.appendChild(listItem);
    }

    debouncedDisplaySuggestions() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        this.debounceTimeout = setTimeout(() => this.displaySuggestions(), 300); // 延迟300ms
    }

    displaySuggestions() {
        const input = document.getElementById('searchQuery');
        const query = input.value.trim();
        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.border = '1px solid #ccc'
        this.suggestions = []; // 重置建议列表

        if (!query) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        // 明确用户是否处于登录状态
        if (this.words.length === 0) {
            fetch(`/api/words?username=${this.username}`, {
                credentials: 'include' // 确保包含 httpOnly cookie
            })
                .then(response => response.json())
                .then(words => this.words = words)
                .catch(error => console.error('Error fetching suggestions:', error));
        }
        this.suggestions = this.words.filter(word =>
            word.motherLanguage.toLowerCase().startsWith(query.toLowerCase()) ||
            word.german.toLowerCase().startsWith(query.toLowerCase())
        );
        if (this.suggestions.length === 0) {
            this.suggestions = this.words.filter(word =>
                word.motherLanguage.toLowerCase().includes(query.toLowerCase()) ||
                word.german.toLowerCase().includes(query.toLowerCase())
            );
        }
        console.log('filtered words:', this.suggestions); // 添加调试日志
        this.selectedIndex = -1;
        this.suggestions.forEach((word, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.innerText = `${word.german} - ${word.motherLanguage}`;
            suggestionItem.classList.add('suggestion-item');
            suggestionItem.addEventListener('click', () => {
                this.displaySearchResults(word); // 使用选择的单词进行搜索
                input.value = '';
                this.clearSuggestions();
            });
            suggestionsContainer.appendChild(suggestionItem);
        });
        suggestionsContainer.style.display = this.suggestions.length > 0 ? 'block' : 'none';
    }

    clearSuggestions() {
        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        this.suggestions = [];
        this.selectedIndex = -1;
    }

    handleMouseMove() {
        const suggestionItems = document.getElementsByClassName('suggestion-item');
        
        // 清除所有项的 hover 效果
        Array.from(suggestionItems).forEach(item => {
            item.style.backgroundColor = 'white'; // 恢复背景颜色
        });
        
        const hoveredElement = document.querySelector('.suggestion-item:hover');
        if (hoveredElement) {
            hoveredElement.style.backgroundColor = '#eee'; // 高亮鼠标悬停的项
            this.selectedIndex = Array.from(suggestionItems).indexOf(hoveredElement);
        }
    }

    handleKeyDown(event) {
        const suggestionsContainer = document.getElementById('suggestions');
        this.noHoverActive = true;

        // 移除所有项的 hover 效果
        Array.from(suggestionsContainer.children).forEach(item => {
            item.style.backgroundColor = 'white'; // 恢复背景颜色
        });

        switch (event.key) {
            case 'ArrowDown':
                this.selectedIndex = this.selectedIndex + 1 > this.suggestions.length - 1 ?
                    this.suggestions.length - 1
                    : this.selectedIndex + 1;
                this.highlightSuggestion();
                break;
            case 'ArrowUp':
                this.selectedIndex = this.selectedIndex - 1 < 0 ?
                    0 : this.selectedIndex - 1;
                this.highlightSuggestion();
                break;
            case 'Enter':
                if (this.selectedIndex >= 0) {
                    this.displaySearchResults(this.suggestions[this.selectedIndex]);
                    suggestionsContainer.style.display = 'none';
                    document.getElementById('searchQuery').value = '';
                }
                break;
            case 'Escape':
                this.clearSuggestions();
                break;
        }
    }

    highlightSuggestion() {
        const suggestionsContainer = document.getElementById('suggestions');
        Array.from(suggestionsContainer.children).forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.style.backgroundColor = '#eee'; // 高亮选中项
                item.scrollIntoView({
                    behavior: 'smooth', // Optional: Smooth scrolling
                    block: 'nearest'    // Ensure the item is in view
                });
            } else {
                item.classList.remove('selected');
            }
        });
    }

    async updateWordCategory(wordId, newCategory) {
        console.log('Updating word category:', { wordId, newCategory }); // 添加调试日志
        try {
            const response = await fetch(`/api/words/${wordId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ categoryAdd: newCategory }),
                credentials: 'include' // 确保包含 httpOnly cookie
            });

            if (!response.ok) {
                console.error('Failed to update word category:', response.statusText);
            } else {
                const data = await response.json();
                console.log('Word updated:', data);
                // 更新完后，重新获取数据并刷新展示
                await this.fetchWords();
            }
        } catch (error) {
            console.error('更新单词类别时出错:', error);
        }
    }

    // Delete a word and replace it with a random word of the same category
    async deleteWord(id, liElement) {
        try {
            // Send DELETE request to the server
            const response = await fetch(`/api/words/${id}`, {
                method: 'DELETE',
                credentials: 'include' // Ensure httpOnly cookie is sent
            });
    
            if (response.status === 204) {
                // Fetch the updated list of words from the server
                await this.fetchWords();
                // Remove the deleted word from the list
                liElement.remove();
            } else if (response.status === 401) {
                // Ensure we handle 401 error properly
                const data = await response.json(); // Parse the JSON response body
                console.error('Authentication error:', data.error); 
                alert('Session expired, please log in again.'); 
                window.location.href = '/login.html'; // Redirect to login page
            }
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    }

    async setReview(id, liElement) {
        // 先在本地设置单词的 review 状态
        const word = this.words.find(word => word._id === id);
        if (word) {
            word.review = true;
            liElement.remove();
            // 更新 UI
            this.handleCategoryChange();
            try {
                const response = await fetch(`/api/words/${id}/review`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ review: true }),
                    credentials: 'include' // 确保包含 httpOnly cookie
                });

                if (response.ok) {
                    console.log('Review status updated successfully');


                } else {
                    const errorText = await response.text();
                    console.error(`Failed to update review status: ${errorText}`);
                }
            } catch (error) {
                console.error('Error updating review status:', error);
            }
        } else {
            console.error('Word not found in local data');
        }
    }
}