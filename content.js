// Flag for whether or not to show only your own conversations
let showOwnConversationsOnly = true;

// Load the setting from storage
chrome.storage.sync.get(['ownConversationsOnly'], (result) => {
  // If the setting isn't found, default to true
  showOwnConversationsOnly = (result.ownConversationsOnly !== undefined)
    ? result.ownConversationsOnly
    : true;
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.ownConversationsOnly) {
      showOwnConversationsOnly = changes.ownConversationsOnly.newValue;
      if (showOwnConversationsOnly) {
        const listItem = document.querySelector(`li[data-testid*="history-item"]`);
        if (listItem) {
            const parentElement = listItem.parentElement.parentElement.parentElement;
            deleteListItemsNotInStorage(parentElement);
        }   
      }
    }
  });
  

function deleteListItemsNotInStorage(parentElement) {
    if (!showOwnConversationsOnly) return;

    chrome.storage.sync.get({ conversations: [] }, function(result) {
        const storedConversations = result.conversations;
        // console.log("Result", storedConversations);
        // Select all the <li> elements whose data-testid starts with "history-item"
        const listItems = parentElement.querySelectorAll('li[data-testid^="history-item"]');

        // Calculate the index for the 6th item from the end of the *original* list
        const indexToHide = listItems.length >= 6 ? listItems.length - 6 : -1;

        listItems.forEach((li, i) => {
            const anchor = li.querySelector('a[href^="/c/"]');
            if (anchor) {
                const href = anchor.getAttribute('href');
                // Extract the conversation ID from the href
                const conversationId = href.split('/c/')[1];
                
                // If this conversation ID is not in storage, decide how to handle it
                if (!storedConversations.includes(conversationId)) {
                    // If we're at the 6th-from-last index, hide it; otherwise, remove it
                    if (i === indexToHide) {
                        li.style.visibility = 'hidden';
                    } else {
                        li.style.display = 'none';
                    }
                }
            }
        });
    });
}

function selectListItemByTestIdIncludes(substring) {
    const initialObserver = new MutationObserver((mutationsList, observer) => {
        const listItem = document.querySelector(`li[data-testid*="${substring}"]`);
        if (listItem) {
            const parentElement = listItem.parentElement.parentElement.parentElement;
            observer.disconnect(); // Stop observing the document's changes

            // Now set up a new observer on the parentElement
            const parentObserver = new MutationObserver((mutationsList, observer) => {
                // Handle changes on the parent element here
                deleteListItemsNotInStorage(parentElement);
            });
            
            // Observe the parent element for changes (child list modifications, attributes, etc.)
            parentObserver.observe(parentElement, {
                childList: true,
                subtree: true,
                attributes: true // Include this line if you want to observe attribute changes
            });
        }
    });

    // Start observing the document for changes
    initialObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

selectListItemByTestIdIncludes('history-item');
