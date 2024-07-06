// Global variables
let words = []; // Array to store words fetched from the server
let showChineseWords = true;
let showGermanWords = true;
let shuffledWords = []; // Array to store shuffled words
let numberOfWords = document.getElementById('numberOfWords');

document.addEventListener('DOMContentLoaded', (event) => {
    fetchWords();
});



function fetchWords() {

    // Fetch words from the server
    fetch('http://localhost:3000/api/words')
        .then(response => response.json())
        .then(data => {
            words = data;
            numberOfWords.innerHTML = words.length;
            // Optionally display words initially if needed
        })

        .catch(error => console.error('Error fetching words:', error));
}

async function addWord() {
    const chinese = document.getElementById('chinese').value;
    const german = document.getElementById('german').value;
    const category = document.getElementById('category').value;

    const response = await fetch('http://localhost:3000/api/words', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chinese, german, category })
    });

    if (response.ok) {
        alert('Word added successfully!');
        // Optionally clear the input fields
        document.getElementById('chinese').value = '';
        document.getElementById('german').value = '';
        document.getElementById('category').value = 'tech';
    } else {
        alert('Failed to add word');
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

async function deleteWord(id, buttonElement) {
    if (confirm('Are you sure you want to delete this word?')) {
        const response = await fetch(`http://localhost:3000/api/words/${id}`, { method: 'DELETE' });

        if (response.ok) {
            alert('Word deleted successfully!');
            // Remove the word from the list without refreshing
            const listItem = buttonElement.parentElement;
            listItem.remove();
        } else {
            alert('Failed to delete word');
        }
    }
}