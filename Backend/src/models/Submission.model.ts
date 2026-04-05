import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: { type: String, required: true },
    language: {
      type: String,
      enum: ['javascript', 'python'],
      required: true,
    },
    code: { type: String, required: true },
    verdict: {
      type: String,
      enum: [
        'Accepted',
        'Wrong Answer',
        'Runtime Error',
        'Time Limit Exceeded',
        'Compile Error',
      ],
      required: true,
    },
    passedTestCases: { type: Number, required: true },
    totalTestCases: { type: Number, required: true },
    executionTimeMs: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SubmissionModel = mongoose.model('Submission', submissionSchema);
