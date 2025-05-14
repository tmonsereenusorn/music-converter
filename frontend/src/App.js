import logo from './logo.svg';
import { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUrlChange = (event) => {
    setUrl(event.target.value);
  }

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  }

  const handleArtistChange = (event) => {
    setArtist(event.target.value);
  }

  const handleAlbumChange = (event) => {
    setAlbum(event.target.value);
  }

  const handleSubmit = () => {
    setLoading(true);
    const data = {
      url,
      title,
      artist,
      album
    };

    fetch('http://127.0.0.1:5000/convert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(async response => {
        for (const [key, value] of response.headers.entries()) {
          console.log(`${key}: ${value}`);
        }
        
        const disposition = response.headers.get('Content-Disposition');
        const filenameMatch = disposition && disposition.match(/filename="(.+)"/);
        const filename = filenameMatch ? filenameMatch[1] : 'download.mp3';
        const blob = await response.blob();
        return { filename, blob };
      })
      .then(({ filename, blob }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(error => console.error('Error:', error))
      .finally(() => setLoading(false));
  }

  return (
    <div className="App">
      <nav className="App-nav">
        <h1>Music Converter</h1>
      </nav>
      <div className="form">
        <input className="url-bar"
          onChange={handleUrlChange}
          value={url}
          type="text"
          placeholder="Enter URL to convert"
        />
        <div className='metadata-container'>
          <h2 className='metadata-title'>Song Metadata</h2>
          <div className='metadata-field'>
            <h1 className='metadata-field-title'>Title</h1>
            <input className='metadata-input'
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Title (optional)"
            />
          </div>
          <div className='metadata-field'>
            <h1 className='metadata-field-title'>Artist</h1>
            <input className='metadata-input'
              type="text"
              value={artist}
              onChange={handleArtistChange}
              placeholder="Artist (optional)"
            />
          </div>
          <div className='metadata-field'>
            <h1 className='metadata-field-title'>Album</h1>
            <input className='metadata-input'
              type="text"
              value={album}
              onChange={handleAlbumChange}
              placeholder="Album (optional)"
            />
          </div>
        </div>

        <button onClick={handleSubmit}>Convert</button>
      </div>
      {loading && (
        <div className="overlay">
          <div className="loader"></div>
          <p className="overlay-text">Converting your song...</p>
        </div>
      )}
    </div>
  );
}

export default App;
