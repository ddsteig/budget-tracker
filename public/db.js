let db;

// Creates new db request for database

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // Creates object store called 'pending'
  // Sets autoIncrement to true

  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  // Conditional to see if app is online before reading db

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  // Create transaction on 'pending' db
  // Has readwrite access

  const transaction = db.transaction(["pending"], "readwrite");

  // Access 'pending' object store

  const store = transaction.objectStore("pending");

  // Add method to add record data to store

  store.add(record);
}

function checkDatabase() {
  // Opens transaction on pending db
  // Accesses pending object store
  // Gets all record data from store and sets to a variable

  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // On success, open transaction to pending db
          // Access the 'pending' object store
          // Clear all items in the store
          const transaction = db.transaction(["pending"], "readwrite");
          const store = transaction.objectStore("pending");
          store.clear();
        });
    }
  };
}

// Event listener to check for online status
window.addEventListener("online", checkDatabase);
