"use strict";

const form = document.querySelector(".form");
const workoutsUl = document.querySelector(".workouts");

const inputDistance = document.querySelector(".form__input__distance");
const inputDuration = document.querySelector(".form__input__duration");
const inputSteps = document.querySelector(".form__input__steps");

const deleteBtn = document.querySelector(".delete_btn");
const editBtn = document.querySelector(".edit_btn");
const finishEdit = document.querySelector(".edit_btn_finish");
const sortDescBtn = document.querySelector(".sort__desc");
const sortAscBtn = document.querySelector(".sort__asc");
const sortDateDescBtn = document.querySelector(".sort__date-desc");
const sortDateAscBtn = document.querySelector(".sort__date-asc");

class Workout {
  id = (Date.now() + "").slice(-10);
  date = new Date();
  constructor(coords, distance, duration, steps) {
    this.distance = distance; //km
    this.duration = duration; //min
    this.steps = steps;
    this.coords = coords; //[lat,lng]

    this.calcCalories();
    this._setDescription();
  }

  calcCalories() {
    this.calories = this.steps * 0.04;
    return this.calories;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `Running on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  workEl; //for delete function
  work; //for splice method
  markerId;
  markerIds = [];

  constructor() {
    this._getposition();
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    workoutsUl.addEventListener("click", this._findWorkout.bind(this));
    workoutsUl.addEventListener("click", this._deleteWorkout.bind(this));
    workoutsUl.addEventListener("click", this._moveToPopup.bind(this));
    workoutsUl.addEventListener("click", this._editWorkout.bind(this));
    workoutsUl.addEventListener("click", this._finishEdit.bind(this));
    sortDescBtn.addEventListener("click", this._sortAll.bind(this));
    sortAscBtn.addEventListener("click", this._sortAll.bind(this));
    sortDateDescBtn.addEventListener("click", this._sortAll.bind(this));
    sortDateAscBtn.addEventListener("click", this._sortAll.bind(this));
  }

  _getposition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderMarkerOnMap(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value = inputDuration.value = inputSteps.value = "";
    form.classList.add("hidden");
  }

  _newWorkout(e) {
    e.preventDefault();
    let workout;

    let distance = +inputDistance.value;
    let duration = +inputDuration.value;
    const steps = +inputSteps.value;
    const { lat, lng } = this.#mapEvent.latlng;

    if (distance < 0 || duration < 0 || steps < 0) {
      alert("Enter value bigger that 0");
      return;
    }

    if (!steps) {
      alert("Please write the steps");
      return;
    }

    if (!distance) {
      distance = "unknown";
    }

    if (!duration) {
      duration = "unknown";
    }

    workout = new Workout([lat, lng], distance, duration, steps);

    this.#workouts.push(workout);

    this._renderMarkerOnMap(workout);

    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  _renderMarkerOnMap(workout) {
    this.markerId = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "leaflet_workout",
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
    this.markerIds.push(this.markerId);

    workout.markerid = this.markerId._leaflet_id;
  }

  _removeMarker(workout) {
    const removeMaekerEl = this.markerIds.find(
      (m) => m._leaflet_id === workout.markerid
    );
    this.#map.removeLayer(removeMaekerEl);
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout" data-id="${workout.id}">
      <h2 class="workout__header">
        ${workout.description}
      </h2>
      <div class="workout__details" data-id="${workout.id}">
        <span class="workout__icon">🏃‍♀️</span>
        <span class="workout__value workout__distance">${
          workout.distance
        }</span>
        <span class="workout__unit">km</span>
      </div>
      <input class="form__input input__distance edit hide__input" data-id="${
        workout.id
      }" placeholder="${workout.distance} km"/>
      <div class="workout__details" data-id="${workout.id}">
        <span class="workout__icon">⏲</span>
        <span class="workout__value workout__duration">${
          workout.duration
        }</span>
        <span class="workout__unit">min</span>
      </div>
      <input class="form__input input__duration edit hide__input" data-id="${
        workout.id
      }" placeholder="${workout.duration} min"/>
      <div class="workout__details" data-id="${workout.id}">
        <span class="workout__icon">👟</span>
        <span class="workout__value workout__steps">${workout.steps}</span>
        <span class="workout__unit"></span>
      </div>
      <input class="form__input input__steps edit hide__input" data-id="${
        workout.id
      }" placeholder="${workout.steps} steps"/>
      <div class="workout__details" data-id="${workout.id}">
        <span class="workout__icon">🔥</span>
        <span class="workout__value">${workout.calories.toFixed(1)}</span>
        <span class="workout__unit">kcal</span>
      </div>
      <button class="form__btn delete_btn">❌</button>
      <button class="form__btn edit_btn" data-id="${workout.id}">✏</button>
      <button class="form__btn edit_btn_finish hide__input" data-id="${
        workout.id
      }">✅</button>
    </li>`;

    form.insertAdjacentHTML("afterend", html);
  }

  _findWorkout(e) {
    const workoutEl = e.target.closest(".workout");

    this.workEl = workoutEl;

    if (!workoutEl) return;

    const workout = this.#workouts.find((w) => w.id === this.workEl.dataset.id);
    this.work = workout;
  }

  _moveToPopup(e) {
    if (
      !this.workEl ||
      e.target.className === "form__btn delete_btn" ||
      e.target.className === "form__btn edit_btn_finish" ||
      e.target.className === "form__btn edit_btn"
    )
      return;

    this.#map.setView(this.work.coords, 13, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _deleteWorkout(e) {
    if (e.target.className === "form__btn delete_btn") {
      if (!window.confirm("Do you really want to delete workout?")) return;
      this.workEl.remove();
      this.#workouts.splice(this.#workouts.indexOf(this.work), 1);
      this._removeMarker(this.work);

      this._setLocalStorage();
    }
  }

  _editWorkout(e) {
    this._findWorkout(e);
    if (e.target.className !== "form__btn edit_btn") return;

    const editFields = document.querySelectorAll(".edit");
    const workoutDetails = document.querySelectorAll(".workout__details");
    const editBtns = document.querySelectorAll(".edit_btn");
    const finishBtns = document.querySelectorAll(".edit_btn_finish");

    [...workoutDetails]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.add("hide__input"));
    [...editFields]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.remove("hide__input"));

    [...editBtns]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.add("hide__input"));
    [...finishBtns]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.remove("hide__input"));

    const i = [...editFields].findIndex((w) => w.dataset.id === this.work.id);

    [...editFields][i].focus();
  }

  _finishEdit(e) {
    this._findWorkout(e);

    if (e.target.className !== "form__btn edit_btn_finish") return;

    const editInputDistance = document.querySelectorAll(".input__distance");
    const editInputDuration = document.querySelectorAll(".input__duration");
    const editInputSteps = document.querySelectorAll(".input__steps");

    const editFields = document.querySelectorAll(".edit");
    const workoutDetails = document.querySelectorAll(".workout__details");
    const editBtns = document.querySelectorAll(".edit_btn");
    const finishBtns = document.querySelectorAll(".edit_btn_finish");

    [...workoutDetails]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.remove("hide__input"));
    [...editFields]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.add("hide__input"));

    [...editBtns]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.remove("hide__input"));
    [...finishBtns]
      .filter((w) => w.dataset.id === this.work.id)
      .forEach((w) => w.classList.add("hide__input"));

    [...editInputDistance].filter((w) => w.dataset.id === this.work.id);
    [...editInputDuration].filter((w) => w.dataset.id === this.work.id);
    [...editInputSteps].filter((w) => w.dataset.id === this.work.id);

    const i = [...editInputDistance].findIndex(
      (w) => w.dataset.id === this.work.id
    );

    let newDistance = +editInputDistance[i].value;
    let newDuration = +editInputDuration[i].value;
    let newSteps = +editInputSteps[i].value;

    if (newDistance && newDistance > 0) {
      this.work.distance = newDistance;
    }
    if (newDuration && newDuration > 0) {
      this.work.duration = newDuration;
    }
    if (newSteps && newSteps > 0) {
      this.work.steps = newSteps;
    }

    editInputDistance[i].value =
      editInputDuration[i].value =
      editInputSteps[i].value =
        "";
    this.work.calcCalories();

    if (!newDuration && !newDistance && !newSteps) return;
    this.workEl.remove();
    this._renderWorkout(this.work);
  }

  _sortAll(e) {
    if (
      e.target.className === "form__btn sort__asc" ||
      e.target.className === "form__btn sort__desc"
    ) {
      this.#workouts.sort((a, b) => {
        if (a.steps > b.steps)
          return e.target.className === "form__btn sort__asc" ? -1 : 1;

        if (b.steps > a.steps)
          return e.target.className === "form__btn sort__asc" ? 1 : -1;
      });
      sortDescBtn.classList.toggle("hide__input");
      sortAscBtn.classList.toggle("hide__input");
    }

    if (
      e.target.className === "form__btn sort__date-asc" ||
      e.target.className === "form__btn sort__date-desc"
    ) {
      this.#workouts.sort((a, b) => {
        if (a.id > b.id)
          return e.target.className === "form__btn sort__date-asc" ? 1 : -1;
        if (b.id > a.id)
          return e.target.className === "form__btn sort__date-asc" ? -1 : 1;
      });
      sortDateDescBtn.classList.toggle("hide__input");
      sortDateAscBtn.classList.toggle("hide__input");
    }

    const workoutEl = document.querySelectorAll(".workout");
    [...workoutEl].forEach((w) => w.remove());

    this.#workouts.forEach((w) => this._renderWorkout(w));
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    let data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    data.forEach((w) => (w.__proto__ = Workout.prototype));

    this.#workouts = data;

    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }

  reset() {
    localStorage.removeItem("workouts");
  }
}

const app = new App();
// app.reset();
