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

    // Display username in the span
    const usernameElement = document.getElementById('username');
    const username = localStorage.getItem('username');
    if (username) {
        usernameElement.textContent = username;
    } else {
        usernameElement.textContent = 'Guest';
    }

    // Add event listener for the logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // clear token
            localStorage.removeItem('jwtToken');
            window.location.href = 'http://localhost:3000/login.html';
        });
    }
});

class WordApp {
    constructor(token) {
        this.token = token;
        this.words = [];
        this.shuffledWords = [];
        this.selectedIndex = -1;
        this.suggestions = [];
        this.currentCategory = 'all'; // Initialize the current category. An value must be given!
        this.showMatherLanguageWords = true;
        this.showGermanWords = false;
        this.numberOfWords = document.getElementById('numberOfWords');
        this.wordList = document.getElementById('wordList');
        this.mainCategory = document.getElementById('mainCategory');
        this.subCategory = document.getElementById('subCategory');
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
            this.numberOfWords.innerHTML = this.handleCategoryChange().length;
        } catch (error) {
            console.error('Error fetching words:', error);
        }
    }

    init() {
        this.fetchWords();
        // Add event listeners
        this.mainCategory.addEventListener('change', () => this.handleCategoryChange());
        this.subCategory.addEventListener('change', () => this.handleCategoryChange());
        document.getElementById('btnmatherLanguage').addEventListener('click', () => this.toggleMatherLanguage());
        document.getElementById('btnGerman').addEventListener('click', () => this.toggleGerman());
        document.getElementById('addWordButton').addEventListener('click', () => this.addWord());
        document.getElementById('randomWordsForm').addEventListener('submit', (event) => this.handleFormSubmit(event));
        document.getElementById('searchQuery').addEventListener('input', () => this.debouncedDisplaySuggestions());
        document.getElementById('clearButton').addEventListener('click', () => this.clearResult());
        document.getElementById('searchQuery').addEventListener('keydown', (event) => this.handleKeyDown(event));

    }

    clearResult() {
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchQuery').value = '';
        document.getElementById('suggestions').innerHTML = '';
    }

    // Handle category selection and update the displayed words
    handleCategoryChange() {
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

        // Update the number of words display
        this.numberOfWords.innerHTML = categoryWords.length;
        return categoryWords;
    }

    // Add a new word to the server and update the list of words
    async addWord() {
        let matherLanguage = document.getElementById('matherLanguage').value; // Get the matherLanguage word
        let german = document.getElementById('german').value; // Get the German word
        let categoryAdd = document.getElementById('categoryAdd').value; // Get the category

        // Validate input fields
        if (!matherLanguage || !german || !categoryAdd) {
            alert('Missing required fields');
            return;
        }

        try {
            // Check if the word already exists
            const fetchResponse = await fetch('http://localhost:3000/api/words', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            const words = await fetchResponse.json();
            const duplicate = words.find(word => word.matherLanguage === matherLanguage && word.german === german);
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
                body: JSON.stringify({ matherLanguage, german, categoryAdd }),
            });

            if (response.ok) {
                alert('Word added successfully');
                // Clear the input fields after successfully adding the word
                document.getElementById('matherLanguage').value = '';
                document.getElementById('german').value = '';
                this.fetchWords(); // Refresh the word list
            } else {
                const errorData = await response.text(); // 获取文本而不是 JSON
                console.error('Error adding word:', errorData);
                alert('Error adding word: ' + errorData);
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
            if (this.showMatherLanguageWords && this.showGermanWords) {
                li.textContent = `${word.matherLanguage} - ${word.german}`;
            } else if (this.showMatherLanguageWords) {
                li.textContent = word.matherLanguage;
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

    // Toggle the visibility of matherLanguage words
    toggleMatherLanguage() {
        this.showMatherLanguageWords = !this.showMatherLanguageWords;
        document.getElementById('btnmatherLanguage').textContent = this.showMatherLanguageWords ? 'Hide matherLanguage' : 'Show matherLanguage';
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
        this.shuffledWords = this.handleCategoryChange().sort(() => 0.5 - Math.random()).slice(0, quantity);
        this.displayWords(this.shuffledWords);
        // Clear the input field after displaying the words
        quantityInput.value = ''; 
    }

    // Search for words based on a query and display results
    async searchWords(query) {
        if (!query) {
            this.displaySearchResults([]);
            this.clearSuggestions();
            return;
        }

        try {
            const response = await fetch(`http://localhost:3000/api/words/search?query=${query}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
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
        const resultsContainer = document.getElementById('searchResults');
        resultsContainer.innerHTML = ''; // 清空结果容器

        words.forEach(word => {
            const listItem = document.createElement('li');
            listItem.innerText = `${word.matherLanguage} - ${word.german}`;

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
            deleteButton.addEventListener('click', async () => {
                try {
                    await fetch(`/api/words/${word._id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${this.token}`
                        }
                    });
                    // 从展示列表中移除词条
                    listItem.remove();
                    await this.fetchWords(); // 重新获取数据并刷新展示
                } catch (error) {
                    console.error('删除单词时出错:', error);
                }
            });
            listItem.appendChild(deleteButton);

            resultsContainer.appendChild(listItem);
        });
    }

    debouncedDisplaySuggestions() {
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        this.debounceTimeout = setTimeout(() => this.displaySuggestions(), 300); // 延迟300ms
    }

    displaySuggestions() {
        const query = document.getElementById('searchQuery').value.trim();
        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = '';
        this.suggestions = []; // 重置建议列表

        if (!query) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        // 从 API 获取该用户名下的所有单词
        fetch(`http://localhost:3000/api/words?username=${this.username}`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        })
            .then(response => response.json())
            .then(words => {
                // 过滤包含输入字符的单词
                this.suggestions = words.filter(word =>
                    word.matherLanguage.toLowerCase().includes(query.toLowerCase()) ||
                    word.german.toLowerCase().includes(query.toLowerCase())
                );
                console.log('filtered words:', this.suggestions); // 添加调试日志
                this.selectedIndex = -1;
                this.suggestions.forEach((word, index) => {
                    const suggestionItem = document.createElement('div');
                    // 根据匹配属性设置文本内容
                    if (word.matherLanguage.toLowerCase().includes(query.toLowerCase())) {
                        suggestionItem.textContent = word.matherLanguage;
                    } else if (word.german.toLowerCase().includes(query.toLowerCase())) {
                        suggestionItem.textContent = word.german;
                    }
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.addEventListener('click', () => this.selectSuggestion(index));
                    suggestionsContainer.appendChild(suggestionItem);
                });

                suggestionsContainer.style.display = this.suggestions.length > 0 ? 'block' : 'none';
            })
            .catch(error => console.error('Error fetching suggestions:', error));
    }

    selectSuggestion(index) {
        const queryInput = document.getElementById('searchQuery');
        const selectedWord = this.suggestions[index];
        // 根据匹配属性设置输入框的值
        if (selectedWord.matherLanguage.toLowerCase().includes(queryInput.value.toLowerCase())) {
            queryInput.value = selectedWord.matherLanguage;
        } else if (selectedWord.german.toLowerCase().includes(queryInput.value.toLowerCase())) {
            queryInput.value = selectedWord.german;
        }
        this.searchWords(queryInput.value); // 使用选择的单词进行搜索
        this.clearSuggestions();
    }

    clearSuggestions() {
        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        this.suggestions = [];
        this.selectedIndex = -1;
    }

    handleKeyDown(event) {
        const suggestionsContainer = document.getElementById('suggestions');
        if (suggestionsContainer.style.display === 'none') return;

        switch (event.key) {
            case 'ArrowDown':
                this.selectedIndex = (this.selectedIndex + 1) % this.suggestions.length;
                this.highlightSuggestion();
                break;
            case 'ArrowUp':
                this.selectedIndex = (this.selectedIndex - 1 + this.suggestions.length) % this.suggestions.length;
                this.highlightSuggestion();
                break;
            case 'Enter':
                if (this.selectedIndex >= 0) {
                    this.selectSuggestion(this.selectedIndex);
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
                item.classList.add('selected');
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
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ categoryAdd: newCategory })
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
            const response = await fetch(`http://localhost:3000/api/words/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}` // Ensure the token is sent with the request
                }
            });

            if (response.status === 204) {
                // Fetch the updated list of words from the server
                await this.fetchWords();
                // Get remaining words of the current category
                this.handleCategoryChange();
                liElement.parentNode.removeChild(liElement);
            } else {
                console.error('Failed to delete word');
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
            liElement.parentNode.removeChild(liElement);
            // 更新 UI
            this.handleCategoryChange();
            try {
                const response = await fetch(`http://localhost:3000/api/words/${id}/review`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ review: true })
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