from flask import Flask, jsonify, render_template, request
import cv2
import mediapipe as mp
import json
import os

app = Flask(__name__)

# ---------- MediaPipe ----------
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=1)

cap = cv2.VideoCapture(0)

# ---------- Score storage ----------
SCORE_FILE = "scores.json"

if not os.path.exists(SCORE_FILE):
    with open(SCORE_FILE, "w") as f:
        json.dump([], f)


def load_scores():
    with open(SCORE_FILE) as f:
        return json.load(f)


def save_scores(scores):
    with open(SCORE_FILE, "w") as f:
        json.dump(scores, f)


def update_scores(name, score):
    scores = load_scores()
    scores.append({"name": name, "score": score})
    scores = sorted(scores, key=lambda x: x["score"], reverse=True)[:5]
    save_scores(scores)
    return scores


# ---------- Finger counting ----------
def count_fingers(hand_landmarks):
    tips = [8, 12, 16, 20]
    count = 0
    for tip in tips:
        if hand_landmarks.landmark[tip].y < hand_landmarks.landmark[tip-2].y:
            count += 1
    return count


# ---------- Routes ----------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/gesture")
def gesture():
    ret, frame = cap.read()

    if not ret:
        return jsonify({"fingers":0,"x":0.5})

    frame = cv2.flip(frame,1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    result = hands.process(rgb)

    fingers = 0
    x_pos = 0.5

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            fingers = count_fingers(hand_landmarks)
            x_pos = hand_landmarks.landmark[9].x

    return jsonify({"fingers":fingers,"x":x_pos})


@app.route("/submit_score", methods=["POST"])
def submit_score():

    data = request.json
    name = data["name"]
    score = data["score"]

    scores = update_scores(name, score)

    return jsonify(scores)


@app.route("/leaderboard")
def leaderboard():
    return jsonify(load_scores())


if __name__ == "__main__":
    app.run(debug=True)