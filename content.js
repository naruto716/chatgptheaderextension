// Flag for whether or not to show only your own conversations
let showOwnConversationsOnly = true;

// Load the setting from storage
chrome.storage.sync.get(['ownConversationsOnly'], (result) => {
  // If the setting isn't found, default to true
  showOwnConversationsOnly = (result.ownConversationsOnly !== undefined)
    ? result.ownConversationsOnly
    : true;
});

// Added: global flag for showing projects
let showProjects = true;
chrome.storage.sync.get(['showProjects'], (result) => {
  showProjects = (result.showProjects !== undefined) ? result.showProjects : true;
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
    } else if (area === 'sync' && changes.showProjects) {  // Added block for projects
      showProjects = changes.showProjects.newValue;
      const projectList = document.querySelector('[aria-labelledby="snorlax-heading"]');
      if (projectList) {
          deleteProjectNotInStorage(projectList);
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

function deleteProjectNotInStorage(parentElement) {
    if (!showProjects) return;
    chrome.storage.sync.get({ projects: [] }, function(result) {
        const storedProjects = result.projects;
        
        const projectItems = parentElement.querySelectorAll('div');
        projectItems.forEach(element => {
            const anchor = element.querySelector('a[href^="/g/"]');
            if (anchor) {
                const href = anchor.getAttribute('href');
                const projectId = href.match(/\/g\/(g-p-[0-9a-f]+)(?:-[^\/]+)?\/project/i)?.[1];
                if (projectId && !storedProjects.includes(projectId)) {
                    element.style.display = 'none';
                } else {
                    element.style.display = ''; // Reset display if project is in storage
                }
            }
        });
    });
}

let observedParents = new WeakSet();
function selectListItemByTestIdIncludes(substring) {
    const initialObserver = new MutationObserver((mutationsList) => {
        // Find all matching <li> elements for the given substring
        const listItems = document.querySelectorAll(`li[data-testid*="${substring}"]`);
        if (!listItems.length) return;

        listItems.forEach((listItem) => {
            const parentElement = listItem.parentElement?.parentElement?.parentElement;
            if (!parentElement) return;

            // If we haven't attached an observer to this parent before, do it now
            if (!observedParents.has(parentElement)) {
                observedParents.add(parentElement);

                const parentObserver = new MutationObserver(() => {
                    deleteListItemsNotInStorage(parentElement);
                });

                parentObserver.observe(parentElement, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });
            }
        });

        // Observe the project list
        const projectList = document.querySelector('[aria-labelledby="snorlax-heading"]');
        if (projectList) {
            const projectObserver = new MutationObserver(() => {
                deleteProjectNotInStorage(projectList);
            });

            projectObserver.observe(projectList, {
                childList: true,
                subtree: true,
                attributes: true
            });
        }
    });

    // Observe the entire document for new elements (including when user expands the sidebar)
    initialObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Call this once to set up the observer logic
selectListItemByTestIdIncludes('history-item');
