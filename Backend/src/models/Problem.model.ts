import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const starterCodeSchema = new mongoose.Schema(
  {
    javascript: { type: String, default: '// Write your solution here\n' },
    python: { type: String, default: '# Write your solution here\n' },
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    content: { type: String, default: '' },
    tags: [{ type: String }],
    starterCode: { type: starterCodeSchema, default: () => ({}) },
    testCases: [testCaseSchema],
    sampleInput: { type: String, default: '' },
    sampleOutput: { type: String, default: '' },
    hints: [{ type: String }],
    acRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ProblemModel = mongoose.model('Problem', problemSchema);
