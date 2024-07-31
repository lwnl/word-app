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
        this.shuffledWords = [];
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
        document.getElementById('searchButton').addEventListener('click', () => this.searchWords());
    }

    // Handle category selection and update the displayed words
    handleCategoryChange() {
        this.currentCategory = this.mainCategory.value; // Update the current category

        // Update the number of words based on the selected categories
        const subCategoryValue = this.subCategory.value;
        let categoryWords;

        switch (this.currentCategory) {
            case 'all':
                switch (subCategoryValue) {
                    case 'tech':
                        categoryWords = this.words.filter(word => word.categoryAdd === 'tech');
                        break;
                    case 'daily':
                        categoryWords = this.words.filter(word => word.categoryAdd === 'daily');
                        break;
                    default:
                        categoryWords = this.words;
                        break;
                }
                break;

            case 'review':
                switch (subCategoryValue) {
                    case 'tech':
                        categoryWords = this.words.filter(word => word.review === true && word.categoryAdd === 'tech');
                        break;
                    case 'daily':
                        categoryWords = this.words.filter(word => word.review === true && word.categoryAdd === 'daily');
                        break;
                    default:
                        categoryWords = this.words.filter(word => word.review === true);
                        break;
                }
                break;

            case 'unfamiliar':
                switch (subCategoryValue) {
                    case 'tech':
                        categoryWords = this.words.filter(word => word.review === false && word.categoryAdd === 'tech');
                        break;
                    case 'daily':
                        categoryWords = this.words.filter(word => word.review === false && word.categoryAdd === 'daily');
                        break;
                    default:
                        categoryWords = this.words.filter(word => word.review === false);
                        break;
                }
                break;

            default:
                categoryWords = this.words;
                break;
        }

        // Update the number of words display
        this.numberOfWords.innerHTML = categoryWords.length;
        return categoryWords;
    }

    // Add a new word to the server and update the list of words
    async addWord() {
        const matherLanguage = document.getElementById('matherLanguage').value; // Get the matherLanguage word
        const german = document.getElementById('german').value; // Get the German word
        const categoryAdd = document.getElementById('categoryAdd').value; // Get the category

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
                const data = await response.json();
                alert('Word added successfully');
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
            listItem.innerText = `${word.matherLanguage} - ${word.german}`;
            resultsList.appendChild(listItem);
        });
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
                const remainingCategoryWords = this.handleCategoryChange();
                // Update the number of words display
                this.numberOfWords.innerHTML = remainingCategoryWords.length;
                // Get the text of currently displayed words in a unified format
                const displayedWords = Array.from(document.getElementById('wordList').children).map(li => {
                    const text = li.firstChild.textContent;
                    if (this.showMatherLanguageWords && this.showGermanWords) {
                        // Displayed format is matherLanguage - German
                        return text;
                    } else if (this.showMatherLanguageWords) {
                        // Displayed format is matherLanguage only
                        return text.split(' - ')[0]; // Extract matherLanguage part
                    } else if (this.showGermanWords) {
                        // Displayed format is German only
                        return text.split(' - ')[1]; // Extract German part
                    }
                });

                // Ensure each candidate word text is unified for comparison
                const newWordCandidates = remainingCategoryWords.filter(word => {
                    const candidateText = this.showMatherLanguageWords && this.showGermanWords
                        ? `${word.matherLanguage} - ${word.german}`
                        : this.showMatherLanguageWords
                            ? word.matherLanguage
                            : this.showGermanWords
                                ? word.german
                                : `${word.matherLanguage} - ${word.german}`; // Fallback format

                    return !displayedWords.includes(candidateText);
                });
                if (newWordCandidates.length > 0) {
                    // Select a new word from the remaining candidates
                    const newWord = newWordCandidates[Math.floor(Math.random() * newWordCandidates.length)];

                    // Create a list item for the new word
                    const newLi = document.createElement('li');
                    if (this.showMatherLanguageWords && this.showGermanWords) {
                        newLi.textContent = `${newWord.matherLanguage} - ${newWord.german}`;
                    } else if (this.showMatherLanguageWords) {
                        newLi.textContent = newWord.matherLanguage;
                    } else if (this.showGermanWords) {
                        newLi.textContent = newWord.german;
                    }

                    // Create a delete button and add it to the new word item
                    const deleteButton = document.createElement('button');
                    deleteButton.setAttribute("type", "button");
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = () => {
                        this.deleteWord(newWord._id, newLi);
                    };
                    newLi.appendChild(deleteButton);

                    // Replace the deleted word item with the new word item
                    liElement.parentNode.replaceChild(newLi, liElement);
                } else {
                    // If no suitable new words, simply remove the item
                    liElement.parentNode.removeChild(liElement);
                }
            } else {
                console.error('Failed to delete word');
            }
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    }

    async setReview(id, liElement) {
        // 修改本地数据
        const word = this.words.find(word => word._id === id);
        if (word) {
            word.review = true;

            try {
                const response = await fetch(`http://localhost:3000/api/words/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ review: true })
                });

                if (response.ok) {
                    // 更新UI
                    const remainingCategoryWords = this.handleCategoryChange();

                    // 获取当前显示单词的统一格式文本
                    const displayedWords = Array.from(document.getElementById('wordList').children).map(li => {
                        const text = li.firstChild.textContent;
                        if (this.showMatherLanguageWords && this.showGermanWords) {
                            // 显示格式为 matherLanguage - German
                            return text;
                        } else if (this.showMatherLanguageWords) {
                            // 显示格式为 matherLanguage 仅
                            return text.split(' - ')[0]; // 提取 matherLanguage 部分
                        } else if (this.showGermanWords) {
                            // 显示格式为 German 仅
                            return text.split(' - ')[1]; // 提取 German 部分
                        }
                    });

                    // 确保每个候选单词文本的统一比较格式
                    const newWordCandidates = remainingCategoryWords.filter(word => {
                        const candidateText = this.showMatherLanguageWords && this.showGermanWords
                            ? `${word.matherLanguage} - ${word.german}`
                            : this.showMatherLanguageWords
                                ? word.matherLanguage
                                : this.showGermanWords
                                    ? word.german
                                    : `${word.matherLanguage} - ${word.german}`; // 备用格式

                        return !displayedWords.includes(candidateText);
                    });

                    if (newWordCandidates.length > 0) {
                        // 从剩余候选者中选择一个新单词
                        const newWord = newWordCandidates[Math.floor(Math.random() * newWordCandidates.length)];

                        // 为新单词创建列表项
                        const newLi = document.createElement('li');
                        if (this.showMatherLanguageWords && this.showGermanWords) {
                            newLi.textContent = `${newWord.matherLanguage} - ${newWord.german}`;
                        } else if (this.showMatherLanguageWords) {
                            newLi.textContent = newWord.matherLanguage;
                        } else if (this.showGermanWords) {
                            newLi.textContent = newWord.german;
                        }

                        // 创建并添加 Review 按钮到新单词项
                        const reviewButton = document.createElement('button');
                        reviewButton.setAttribute("type", "button");
                        reviewButton.textContent = 'setReview';
                        reviewButton.onclick = () => {
                            this.setReview(newWord._id, newLi);
                        };
                        newLi.appendChild(reviewButton);

                        // 替换当前项为新项
                        liElement.parentNode.replaceChild(newLi, liElement);
                    } else {
                        // 如果没有合适的新单词，直接移除项
                        liElement.parentNode.removeChild(liElement);
                    }
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