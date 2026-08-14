import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SignedIn,
  RedirectToSignIn,
  UserButton,
} from '@neondatabase/neon-js/auth/react/ui';
import './dashboard.css';
import logoImg from '../assets/cropped-Logo-Abayo-Co.-Advocates.png';

export function Home() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'Files' | 'ref' | 'setting'
  >('Files');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [dep, setDep] = useState('Litigation');
  const [fileType, setFileType] = useState('civil');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);


  const handleLogout = async () => {
    navigate('/auth/sign-out');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFullName('');
    setDep('Litigation');
    setFileType('civil');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const queryParams = new URLSearchParams({
      fullName,
      dep,
      fileType,
    }).toString();

    navigate(`/Fillereg?${queryParams}`);

    closeModal();
  };

  return (
    <>
      <SignedIn>
        <div className="container">

          <div className="navigation">

            <div className="logo">
              <img
                src={logoImg}
                alt="Abayo & Co Advocates Logo"
              />
            </div>

            <nav>
              <ul>

                <li>
                  <a
                    href="#overview"
                    className={`nav-link ${
                      activeTab === 'overview' ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('overview');
                    }}
                  >
                    <span className="tab-code">OV</span>
                    Overview
                  </a>
                </li>

                <li>
                  <a
                    href="#files"
                    className={`nav-link ${
                      activeTab === 'Files' ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('Files');
                    }}
                  >
                    <span className="tab-code">FL</span>
                    Files
                  </a>
                </li>

                <li>
                  <a
                    href="#ref"
                    className={`nav-link ${
                      activeTab === 'ref' ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('ref');
                    }}
                  >
                    <span className="tab-code">RF</span>
                    Reference No
                  </a>
                </li>

                <li>
                  <a
                    href="#settings"
                    className={`nav-link ${
                      activeTab === 'setting' ? 'active' : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab('setting');
                    }}
                  >
                    <span className="tab-code">ST</span>
                    Settings
                  </a>
                </li>

              </ul>
            </nav>

            <button id="logout" onClick={handleLogout}>
              Log-out
            </button>

          </div>

          {/* MAIN PAGE SECTIONS */}

          {activeTab === 'Files' && (
            <section id="Files" className="page active">

              <div className="page-eyebrow">ACA · File Management</div>
              <h1>Features</h1>

              <div className="cards">

                <div
                  className="card"
                  id="openNewFileCard"
                  onClick={() => setIsModalOpen(true)}
                >
                  <span className="card-index">01</span>
                  <h2>Open New File</h2>
                </div>

                <div className="card">
                  <span className="card-index">02</span>
                  <h2>Feature 2</h2>
                </div>
              </div>

            </section>
          )}

          {activeTab === 'overview' && (
            <section id="overview" className="page active">
              <div className="page-eyebrow">ACA · File Management</div>
              <h1>Overview</h1>
              <p>Overview details and statistics go here.</p>
            </section>
          )}

          {activeTab === 'ref' && (
            <section id="ref" className="page active">
              <div className="page-eyebrow">ACA · File Management</div>
              <h1>Reference Numbers</h1>
              <p>Reference number lists go here.</p>
            </section>
          )}

          {activeTab === 'setting' && (
            <section id="setting" className="page active">
              <div className="page-eyebrow">ACA · File Management</div>
              <h1>Settings</h1>
              <p>Account and app preferences go here.</p>

              <div className="user-account">
                <UserButton />
              </div>
            </section>
          )}

          {/* OPEN NEW FILE MODAL */}

          {isModalOpen && (
            <div
              id="newFileModal"
              className="modal-overlay active"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeModal();
                }
              }}
            >

              <div className="modal-box">

                <button
                  type="button"
                  className="modal-close"
                  id="modalClose"
                  onClick={closeModal}
                >
                  &times;
                </button>

                <h2>Open New File</h2>

                <form id="newFileForm" onSubmit={handleSubmit}>

                  <label htmlFor="fullName">
                    Full Name
                  </label>

                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  <label htmlFor="dep">
                    Department
                  </label>

                  <select
                    id="dep"
                    value={dep}
                    onChange={(e) => setDep(e.target.value)}
                  >
                    <option value="Litigation">
                      Litigation
                    </option>

                    <option value="Corporate">
                      Corporate
                    </option>

                    <option value="Administration">
                      Administration
                    </option>
                  </select>

                  <label htmlFor="fileType">
                    File Type
                  </label>

                  <select
                    id="fileType"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                  >
                    <option value="civil">
                      Civil
                    </option>

                    <option value="criminal">
                      Criminal
                    </option>

                    <option value="labour">
                      Labour
                    </option>

                    <option value="administrative">
                      Administrative
                    </option>

                    <option value="arbitration">
                      Arbitration
                    </option>

                    <option value="commercial">
                      Commercial
                    </option>

                    <option value="consultancy">
                      Consultancy
                    </option>
                  </select>

                  <div className="modal-actions">

                    <button
                      type="button"
                      id="modalCancel"
                      className="btn-secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn-primary"
                      id="createFile"
                    >
                      Create File
                    </button>

                  </div>

                </form>

              </div>

            </div>
          )}

        </div>
      </SignedIn>

      <RedirectToSignIn />
    </>
  );
}