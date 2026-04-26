/**
 * データフェッチ機能
 */

export async function fetchQuestions(courseId) {
  try {
    const response = await fetch(`/src/data/${courseId}.json`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return null;
  }
}
