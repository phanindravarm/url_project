import { Button, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
function App() {
  const [url, setUrl] = useState("");
  const [urls, setUrls] = useState([]);
  const [editUrl, setEditUrl] = useState("");
  const [edit, setEdit] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  useEffect(() => {
    fetch("http://localhost:3000/url", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        setUrls(data);
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  function handleChange(e) {
    setUrl(e.target.value);
  }

  function handleEditChange(e) {
    setEditUrl(e.target.value);
  }

  function editItem(url, index) {
    fetch(`http://localhost:3000/edit/${index}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
      },
      body: url,
    }).then((response) => {
      if (response.status === 200) {
        const updatedUrls = [...urls];
        updatedUrls[editingIndex].url = url;
        setUrls(updatedUrls);
      }
    });
  }

  function deleteItem(index) {
    fetch(`http://localhost:3000/${index}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (response.status === 200) {
          const updatedUrls = urls.filter((item) => item.id !== index);
          setUrls(updatedUrls);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function addItem(url) {
    fetch(`http://localhost:3000/url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        setUrls((prevUrls) => [...prevUrls, data]);
      })
      .catch((error) => console.error("Error:", error));

    setUrl("");
  }

  return (
    <>
      <TextField onChange={handleChange} value={url} />
      <Button onClick={() => addItem(url)}>Add</Button>
      <div>
        <h3>List of URLs:</h3>
        <ul>
          {urls.map((item, index) => (
            <li key={item.id}>
              {edit && editingIndex === index ? (
                <>
                  <TextField onChange={handleEditChange} value={editUrl} />
                  <Button
                    onClick={() => {
                      editItem(editUrl, item.id);
                      setEdit(false);
                      setEditingIndex(null);
                    }}
                  >
                    <SaveIcon />
                  </Button>
                </>
              ) : (
                <>
                  {item.url}
                  <Button
                    onClick={() => {
                      deleteItem(item.id);
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                  <Button
                    onClick={() => {
                      setEdit(true);
                      setEditUrl(item.url);
                      setEditingIndex(index);
                    }}
                  >
                    <EditIcon />
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default App;
