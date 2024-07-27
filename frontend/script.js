/**
 * Function list:
 * Store words -- ok
 * Avoid storing duplicate words -- ok
 * Search for words -- ok
 * Randomly display words -- ok
 * Switch word categories 
 * Delete a word and automatically add a word 
 */

// Global variables
let words = []; // Array to store words fetched from the server
let techWords = []; // Array to store technical words
let dailyWords = []; // Array to store daily words
let showChineseWords = true;
let showGermanWords = false;
let shuffledWords = []; // Array to store shuffled words
let numberOfWords = document.getElementById('numberOfWords');


document.addEventListener('DOMContentLoaded', (event) => {
    fetchWords();
});

// add event listener categoryShow, so that when the category is changed, the words list will be updated
const categoryShow = document.getElementById('categoryShow');
categoryShow.addEventListener('change', (event) => {
    const selectedCategory = event.target.value;

    if (selectedCategory === 'tech') {
        words = techWords;
    } else if (selectedCategory === 'daily') {
        words = dailyWords;
    } else {
        words = words;
    }
    numberOfWords.innerHTML = words.length;
});


function fetchWords() {

    // Fetch words from the server
    fetch('http://localhost:3000/api/words')
        .then(response => response.json())
        .then(data => {
            words = data;
            // Optionally display words initially if needed
            // Separate words into techWords and dailyWords arrays
            techWords = data.filter(word => word.categoryAdd === 'tech');
            dailyWords = data.filter(word => word.categoryAdd === 'daily');

            // Optionally display total number of words
            numberOfWords.innerHTML = words.length;

            // Optionally display or use techWords and dailyWords arrays as needed
            console.log('Tech Words:', techWords);
            console.log('Daily Words:', dailyWords);
            console.log('all Words:', words);
        })

        .catch(error => console.error('Error fetching words:', error));
}


//function to add a word
async function addWord() {
    const chinese = document.getElementById('chinese').value;
    const german = document.getElementById('german').value;
    const categoryAdd = document.getElementById('categoryAdd').value;

    if (!chinese || !german || !categoryAdd) {
        alert('Missing required fields');
        return;
    }

    try {
        // Get all words
        const fetchResponse = await fetch('http://localhost:3000/api/words');
        const words = await fetchResponse.json();

        // Check if the new word already exists
        const duplicate = words.find(word => word.chinese === chinese && word.german === german);
        if (duplicate) {
            alert('The word already exists');
            return;
        }

        // If the word does not exist, proceed to add the new word
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

            // Create an object containing all word data and the returned id
            const newWord = {
                _id: data.id,
                chinese,
                german,
                categoryAdd
            };

            fetchWords(); // Fetch words again to update word list
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

function displayWords(wordsToDisplay) {
    // Display words in the UI
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';

    wordsToDisplay.forEach(word => {
        const li = document.createElement('li');
        if (showChineseWords && showGermanWords) {
            li.textContent = `${word.chinese} - ${word.german}`;
        } else if (showChineseWords) {
            li.textContent = word.chinese;
        } else if (showGermanWords) {
            li.textContent = word.german;
        } else {
            return;
        }
        const deleteButton = document.createElement('button');
        deleteButton.setAttribute("type", "button")
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = (event) => {
            deleteWord(word._id, li);
        };
        li.appendChild(deleteButton);

        wordList.appendChild(li);
    });
}

function toggleChinese() {
    // Toggle display of Chinese words
    showChineseWords = !showChineseWords;
    document.getElementById('btnChinese').textContent = showChineseWords ? 'Hide Chinese' : 'Show Chinese';
    displayWords(shuffledWords); // Display shuffled words list
}

function toggleGerman() {
    // Toggle display of German words
    showGermanWords = !showGermanWords;
    document.getElementById('btnGerman').textContent = showGermanWords ? 'Hide Deutsch' : 'Show Deutsch';
    displayWords(shuffledWords); // Display shuffled words list
}



function handleFormSubmit(event) {

    // Handle form submission to get random words
    event.preventDefault();
    const quantityInput = document.getElementById('quantity');
    const quantity = parseInt(quantityInput.value);

    // Validate quantity input
    if (isNaN(quantity)) {
        alert('Please enter a valid number.');
        return;
    }

    if (quantity <= 0) {
        alert('Please enter a number greater than zero.');
        return;
    }

    if (quantity > words.length) {
        alert(`There are only ${words.length} words available.`);
        return;
    }

    // Shuffle words array and take 'quantity' number of elements 
    /* 	排序效果：
    在 .sort() 方法中，比较函数返回的值决定了数组元素的相对顺序。负值会导致第一个参数在排序后排在第二个参数之前，而正值则相反。如果比较函数返回的是随机数，那么每次排序都会根据不同的随机数进行比较，从而达到打乱数组顺序的效果。
    避免偏向性：
    选择在 [-0.5, 0.5) 范围内的随机数，是为了尽可能地避免排序的偏向性。这个范围的选择使得每个元素在排序过程中被重新定位的概率大致相等，从而实现了真正的随机排序。 */

    shuffledWords = [...words].sort(() => 0.5 - Math.random()).slice(0, quantity);

    // Display shuffled words list
    displayWords(shuffledWords);
}

async function searchWords() {
    const query = document.getElementById('searchQuery').value.trim();

    if (!query) {
        // if query is empty, clear the search results
        displaySearchResults([]);
        return;
    }

    console.log('Searching for:', query); // add log

    const response = await fetch(`http://localhost:3000/api/words/search?query=${query}`);
    if (!response.ok) {
        console.error('Search failed:', response.statusText);
        return;
    }

    const words = await response.json();
    console.log('Search results:', words); // add log
    displaySearchResults(words);
}

function displaySearchResults(words) {
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

function deleteWord(id, liElement) {
    fetch(`http://localhost:3000/api/words/${id}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (response.status === 204) {
                liElement.parentNode.removeChild(liElement);
                fetchWords()
            } else {
                console.error('Failed to delete word');
            }
        })
        .catch(error => console.error('Error deleting word:', error));
}
