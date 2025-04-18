import React, { useState } from "react";
import { FileUpload } from "primereact/fileupload";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import axios from "axios";
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";

interface Winner {
  inv: string;
  user: string;
}

interface CalculationResult {
  winningNumber: string;
  winners: Winner[];
  totalBayar: number;
  companyRevenue: number;
  prizePool: number;
  totalPlayers: number;
  totalWinners: number;
  winningPercentage: string;
  profitPercentage?: number;
}

const App: React.FC = () => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [profitPercentage, setProfitPercentage] = useState<number>(20);
  const [excludedUsers, setExcludedUsers] = useState<string>("");

  const handleUpload = (event: any) => {
    const file = event.files[0];
    setUploadedFile(file);
  };

  const handleGenerate = () => {
    if (!uploadedFile || profitPercentage === null) return;

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("profitPercentage", profitPercentage.toString());
    
    // Add excluded users if any are specified
    if (excludedUsers.trim()) {
      formData.append("excludedUsers", excludedUsers.trim());
    }
    
    setLoading(true);
    axios
      .post("http://localhost:5000/calculate", formData)
      .then((res) => {
        console.log(res.data);
        setResult(res.data);
        setLoading(false);
        setUploadedFile(null);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleBack = () => {
    setResult(null);
    setLoading(false);
    setUploadedFile(null);
    setProfitPercentage(20);
    setExcludedUsers("");
  };

  return (
    <div 
      className="flex align-items-center justify-content-center" 
      style={{ 
        minHeight: "100vh", 
        backgroundColor: "#f8f9fa",
        padding: "2rem"
      }}
    >
      <Card className="shadow-4" style={{ width: '100%', maxWidth: '800px' }}>
        {result && (
          <Button 
            label="Back" 
            icon="pi pi-arrow-left" 
            onClick={handleBack} 
            className="p-button-rounded p-button-secondary mb-4"
          />
        )}
        <div className="text-center mb-5">
          <h1 className="text-3xl font-bold text-900 mb-3">Togel Number Generator</h1>
          <p className="text-600 mb-4">
            Unggah file CSV untuk menghitung hasil undian dan menentukan pemenang.
          </p>
          {!result && (
            <div className="flex flex-column align-items-center gap-4">
              <FileUpload
                mode="basic"
                name="file"
                accept=".csv"
                customUpload
                auto
                uploadHandler={handleUpload}
                chooseLabel={uploadedFile ? "File Selected" : "Upload CSV"}
                className="p-button-rounded"
              />
              
              <div className="flex align-items-center gap-2">
                <label htmlFor="profit" className="font-medium">Profit Percentage:</label>
                <InputNumber
                  id="profit"
                  value={profitPercentage}
                  onValueChange={(e) => setProfitPercentage(e.value ?? 20)}
                  suffix="%"
                  min={0}
                  max={100}
                  style={{ width: '150px' }}
                />
              </div>

              <div className="flex align-items-center gap-2" style={{ width: '100%', maxWidth: '500px' }}>
                <label htmlFor="excluded-users" className="font-medium">Exclude Users:</label>
                <InputText
                  id="excluded-users"
                  value={excludedUsers}
                  onChange={(e) => setExcludedUsers(e.target.value)}
                  placeholder="Enter usernames separated by comma"
                  className="w-full"
                />
              </div>

              {excludedUsers.trim() && (
                <Message 
                  severity="info" 
                  text={`Users to be excluded: ${excludedUsers.split(',').map(u => u.trim()).filter(u => u).join(', ')}`}
                  className="w-full"
                />
              )}

              <Button
                label="Generate Result"
                icon="pi pi-check"
                onClick={handleGenerate}
                disabled={!uploadedFile || profitPercentage === null}
                className="p-button-rounded p-button-success"
              />
            </div>
          )}
        </div>

        {loading && (
          <div className="text-center">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
            <p className="mt-2">Processing your request...</p>
          </div>
        )}

        {result && (
          <div className="mt-4">
            <div className="mb-5">
              <div className="text-center">
                <h2 className="text-xl text-600 mb-2">Winning Number</h2>
                <div 
                  className="font-bold text-6xl mb-4 p-3 border-round"
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    display: 'inline-block',
                    padding: '1rem 3rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}
                >
                  {result.winningNumber}
                </div>
              </div>
            </div>

            <div className="grid mb-4">
              <div className="col-12 md:col-3">
                <div className="p-4 border-round bg-blue-50 h-full">
                  <h3 className="text-xl text-blue-800 mb-3 font-medium">Total Bayar</h3>
                  <p className="text-2xl text-blue-900 font-bold m-0">
                    {(result.totalBayar || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-4 border-round bg-pink-50 h-full">
                  <h3 className="text-xl text-pink-800 mb-3 font-medium">Profit - {result.profitPercentage || profitPercentage}%</h3>
                  <p className="text-2xl text-pink-900 font-bold m-0">
                    {(result.companyRevenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-4 border-round bg-green-50 h-full">
                  <h3 className="text-xl text-green-800 mb-3 font-medium">Prize Pool</h3>
                  <p className="text-2xl text-green-900 font-bold m-0">
                    {(result.prizePool || 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="col-12 md:col-3">
                <div className="p-4 border-round bg-yellow-50 h-full">
                  <h3 className="text-xl text-yellow-800 mb-3 font-medium">Total Players</h3>
                  <p className="text-2xl text-yellow-900 font-bold m-0">
                    {(result.totalPlayers || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex align-items-center justify-content-between mb-4">
                <h3 className="text-xl font-medium m-0">List Pemenang</h3>
                <div className="flex align-items-center gap-4">
                  <div className="text-right">
                    <span className="block text-500 mb-1">Jumlah Pemenang</span>
                    <span className="text-xl font-bold text-900">{result.totalWinners}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-500 mb-1">Win Rate</span>
                    <span className="text-xl font-bold text-900">{result.winningPercentage}%</span>
                  </div>
                </div>
              </div>
              {result.winners.length > 0 ? (
                <ul className="list-none p-0 m-0">
                  {result.winners.map((winner, index) => (
                    <li 
                      key={index}
                      className="p-3 mb-2 border-round surface-100 flex align-items-center justify-content-between"
                    >
                      <div className="flex align-items-center">
                        <i className="pi pi-check-circle text-green-500 mr-2"></i>
                        <span className="font-medium">{winner.inv}</span>
                      </div>
                      <div className="flex align-items-center">
                        <i className="pi pi-user text-blue-500 mr-2"></i>
                        <span className="text-600">{winner.user}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-600">No winners selected.</p>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default App;