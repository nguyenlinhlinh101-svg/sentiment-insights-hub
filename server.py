from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import os

app = FastAPI(title="Sentiment Insights ML Server")

# Enable CORS for the frontend React application
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model and vectorizer
model_path = "linear_sentiment_model.pkl"
vectorizer_path = "tfidf_vectorizer.pkl"

if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
    raise FileNotFoundError("Model or Vectorizer pickle file not found in the workspace directory.")

model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

class PredictRequest(BaseModel):
    text: str

@app.post("/predict")
def predict(req: PredictRequest):
    text = req.text
    # Transform text to tf-idf features
    X_trans = vectorizer.transform([text])
    
    # Predict continuous score (generally between 1.0 and 5.0)
    raw_prediction = float(model.predict(X_trans)[0])
    
    # Clip the score to ensure it is in the range [1.0, 5.0]
    score = max(1.0, min(5.0, raw_prediction))
    
    # Map to sentiment labels: >= 3.5 is POSITIVE, <= 2.5 is NEGATIVE, else NEUTRAL
    if score >= 3.5:
        label = "POSITIVE"
    elif score <= 2.5:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"
        
    return {
        "label": label,
        "score": round(score, 2),
        "source": "Python ML Model"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
