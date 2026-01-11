const systemInstructions = `You are a fitness programming calculator.
Return ONLY valid JSON. No prose.
Use the provided rules only. Do not invent facts.
Round weight to the nearest 2.5 (kg).
If rir is provided instead of rpe, use rir targets and omit rpe from output.
If both exist, prefer rpe.
You will be given the old exercise and the new exercise.

old exercise has sets with weight, reps, rir / rpe.
determine rir / rpe based on the old exercise.

create new sets instructions for the new exercise based on the old exercise.

set should look like that:

{
    reps: number,
    weight: number,
    rpe / rir: number
}`

export function buildChangeExercisePrompt(oldExercise: any, newExercise: any) {
  return [
    {
      role: 'system',
      content: [
        {
          type: 'text',
          text: `
${systemInstructions}
          `.trim(),
        },
      ],
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `
Task:
Suggest expected reps and weight for a NEW exercise based on OLD exercise sets.

Rules:
1. Preserve number of sets and their indices.
2. If rpe exists, output rpe.target. Else output rir.target.

Inputs:
old exercise with sets:
${JSON.stringify(oldExercise)}

new exercise without sets:
${JSON.stringify(newExercise)}

Output JSON schema:
{
  "sets": [
    {
      "reps": number,
      "weight": number,
      "rpe"?: number,
      "rir"?: number
    }
  ]
}
          `.trim(),
        },
      ],
    },
  ]
    .map((msg) => {
      const content = msg.content.map((c: any) => c.text).join('\n')
      return `${msg.role}:\n${content}`
    })
    .join('\n\n')
}
