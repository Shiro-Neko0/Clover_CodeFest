import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

// One document per person. role is 'elder' or 'caregiver'.
// An elder has a linkCode that a caregiver types in to connect the two accounts.
const User = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['elder', 'caregiver'], required: true },
  linkCode: { type: String, index: true, sparse: true },
  allowPatientMedicationAdd: { type: Boolean, default: true },
  elders: [ref('User')],      // set on caregivers
  caregivers: [ref('User')]   // set on elders
}, { timestamps: true });

// One check-in per elder per day (date is YYYY-MM-DD in Malaysia time). The chat fills it in over the day.
const CheckIn = new Schema({
  elder: { ...ref('User'), required: true, index: true },
  date: { type: String, required: true },
  sleepHours: Number,
  bpSys: Number,
  bpDia: Number,
  symptoms: [String]
}, { timestamps: true });
CheckIn.index({ elder: 1, date: 1 }, { unique: true });

const Meal = new Schema({
  elder: { ...ref('User'), required: true, index: true },
  date: { type: String, required: true },
  name: String,
  kcal: Number,
  carbs: Number,
  protein: Number,
  fat: Number,
  tip: String,
  source: { type: String, enum: ['chat', 'photo'], default: 'chat' }
}, { timestamps: true });

const Medication = new Schema({
  elder: { ...ref('User'), required: true, index: true },
  name: { type: String, required: true },
  dose: String,                 // e.g. "500 mg, 1 tablet after breakfast"
  times: [String],              // e.g. ["08:00", "20:00"]
  active: { type: Boolean, default: true }
}, { timestamps: true });

// One document each time a dose is taken. videoUrl is the proof video; caregivers add notes to it.
const DoseLog = new Schema({
  elder: { ...ref('User'), required: true, index: true },
  medication: ref('Medication'),
  medName: String,
  date: String,
  time: String,
  videoUrl: String,
  takenAt: { type: Date, default: Date.now },
  notes: [{ by: String, text: String, at: { type: Date, default: Date.now } }]
}, { timestamps: true });

const Appointment = new Schema({
  elder: { ...ref('User'), required: true, index: true },
  title: { type: String, required: true },
  place: String,
  date: { type: String, required: true },
  time: String,
  remind: { type: Boolean, default: true }
}, { timestamps: true });

// Warning signs and SOS presses. The caregiver overview shows the latest ones.
const Alert = new Schema({
  elder: { ...ref('User'), required: true, index: true },
  text: { type: String, required: true },
  kind: { type: String, enum: ['sos', 'symptom'], default: 'symptom' }
}, { timestamps: true });

// "models.X ||" stops Mongoose from redefining a model when the dev server reloads.
export const UserM = models.User || model('User', User);
export const CheckInM = models.CheckIn || model('CheckIn', CheckIn);
export const MealM = models.Meal || model('Meal', Meal);
export const MedicationM = models.Medication || model('Medication', Medication);
export const DoseLogM = models.DoseLog || model('DoseLog', DoseLog);
export const AppointmentM = models.Appointment || model('Appointment', Appointment);
export const AlertM = models.Alert || model('Alert', Alert);
