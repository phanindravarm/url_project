import {
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";

function App() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState([]);
  const [customCategory, setCustomCategory] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState([]);
  const [editCustomCategory, setEditCustomCategory] = useState("");
  const [edit, setEdit] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [categories, setCategories] = useState([
    "Technology",
    "Health",
    "Education",
    "Entertainment",
  ]);
  const [urls, setUrls] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:3000/`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        setUrls(data.combinedArray);
        const categoriesArray = data.catRes.map((item) => item.category);
        setCategories(categoriesArray);
      })
      .catch((error) =>
        console.error("Error occurred while fetching URLs:", error)
      );
  }, []);

  function handleChange(e) {
    setUrl(e.target.value);
  }

  function handleCategoryChange(e) {
    const value = e.target.value;
    setCategory(value);
    if (!value.includes("other")) {
      setCustomCategory("");
    }
  }

  function handleCustomCategoryChange(e) {
    setCustomCategory(e.target.value);
  }

  function handleEditChange(e) {
    setEditUrl(e.target.value);
  }

  function handleEditCategoryChange(e) {
    setEditCategory(e.target.value);
    if (!e.target.value.includes("other")) {
      setEditCustomCategory("");
    }
  }

  function handleEditCustomCategoryChange(e) {
    setEditCustomCategory(e.target.value);
  }

  function editItem(url, category, index) {
    if (category.includes("other")) {
      category = category.filter((cat) => cat !== "other");
      category.push(editCustomCategory);
    }
    const finalCategory = category;
    fetch(`http://localhost:3000/edit/${index}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, category: finalCategory }),
    }).then((response) => {
      if (response.status === 200) {
        const updatedUrls = [...urls];
        updatedUrls[editingIndex].url = url;
        updatedUrls[editingIndex].category = finalCategory;
        setUrls(updatedUrls);
        const newCat = [...categories];
        finalCategory.forEach((cat) => {
          if (!newCat.includes(cat)) {
            newCat.push(cat);
          }
        });
        setCategories(newCat);
      }
    });
    setEdit(false);
    setEditingIndex(null);
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
      .catch((error) => console.error("Error deleting URL:", error));
  }

  function addItem(url, category) {
    if (!url || category.length === 0) {
      return;
    }

    if (category.includes("other")) {
      category = category.filter((cat) => cat !== "other");
      category.push(customCategory);
    }
    const finalCategory = category;

    fetch(`http://localhost:3000/url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, category: finalCategory }),
    })
      .then((response) => response.json())
      .then((data) => {
        setUrls((prevUrls) => [...prevUrls, data.combinedArray]);
        const newCat = [...categories];
        data.categories.forEach((cat) => {
          if (!newCat.includes(cat)) {
            newCat.push(cat);
          }
        });
        setCategories(newCat);
      })
      .catch((error) => console.error("Error adding URL:", error));

    setUrl("");
    setCategory([]);
    setCustomCategory("");
  }

  const filteredUrls =
    selectedCategories.length === 0
      ? urls
      : urls.filter((item) =>
          selectedCategories.some((cat) => item.category.includes(cat))
        );

  return (
    <>
      <div>
        {categories.map((categoryName, index) => (
          <Chip
            key={index}
            label={categoryName}
            onClick={() => {
              setSelectedCategories((prev) =>
                prev.includes(categoryName)
                  ? prev.filter((cat) => cat !== categoryName)
                  : [...prev, categoryName]
              );
            }}
            color={
              selectedCategories.includes(categoryName) ? "primary" : "default"
            }
          />
        ))}
      </div>

      <TextField onChange={handleChange} value={url} label="URL" />
      <FormControl fullWidth>
        <InputLabel>Category</InputLabel>
        <Select multiple value={category} onChange={handleCategoryChange}>
          {categories.map((categoryName, index) => (
            <MenuItem key={index} value={categoryName}>
              {categoryName}
            </MenuItem>
          ))}
          <MenuItem value="other">Other (Type)</MenuItem>
        </Select>
      </FormControl>
      {category.includes("other") && (
        <TextField
          onChange={handleCustomCategoryChange}
          value={customCategory}
          label="Custom Category"
        />
      )}

      <Button onClick={() => addItem(url, category)}>Add</Button>

      <div>
        <h3>List of URLs:</h3>
        <ul>
          {filteredUrls.map((item, index) => (
            <li key={item.id}>
              {edit && editingIndex === index ? (
                <>
                  <TextField
                    onChange={handleEditChange}
                    value={editUrl}
                    label="Edit URL"
                  />
                  <FormControl fullWidth>
                    <InputLabel>Edit Category</InputLabel>
                    <Select
                      multiple
                      value={editCategory}
                      onChange={handleEditCategoryChange}
                      label="Edit Category"
                    >
                      {categories.map((categoryName, i) => (
                        <MenuItem key={i} value={categoryName}>
                          {categoryName}
                        </MenuItem>
                      ))}
                      <MenuItem value="other">Other (Type)</MenuItem>
                    </Select>
                  </FormControl>
                  {editCategory.includes("other") && (
                    <TextField
                      onChange={handleEditCustomCategoryChange}
                      value={editCustomCategory}
                      label="Custom Category"
                    />
                  )}
                  <Button
                    onClick={() => {
                      editItem(editUrl, editCategory, item.id);
                    }}
                  >
                    <SaveIcon />
                  </Button>
                </>
              ) : (
                <>
                  <a
                    href={
                      item.url.startsWith("https")
                        ? item.url
                        : `https://${item.url}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {item.url}
                  </a>{" "}
                  -{" "}
                  {item.category.map((hey, idx) => (
                    <span key={idx}>
                      {hey}
                      {idx < item.category.length - 1 ? ", " : ""}
                    </span>
                  ))}
                  <Button onClick={() => deleteItem(item.id)}>
                    <DeleteIcon />
                  </Button>
                  <Button
                    onClick={() => {
                      setEdit(true);
                      setEditUrl(item.url);
                      setEditCategory(item.category);
                      setEditCustomCategory(
                        item.category === "other" ? item.category : ""
                      );
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
