import { analyzeSEO } from './src/utils/seo';

const sampleMarkdown = `
# This is a Perfect Title Length For Google
## Introduction to the Topic

This is a very simple sentence. It is easy to read. Artificial intelligence is rapidly evolving. We are seeing major advancements in machine learning!

Here is an image:
![A robot working](https://example.com/robot.jpg)

Here is a link:
[Click here to learn more](https://example.com)

Dr. Smith said that this is e.g. a good way to test abbreviations.

A very long paragraph to test the wall of text penalty. This paragraph needs to be over 150 words long to trigger the penalty. Artificial intelligence refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving. The ideal characteristic of artificial intelligence is its ability to rationalize and take actions that have the best chance of achieving a specific goal. A subset of artificial intelligence is machine learning, which refers to the concept that computer programs can automatically learn from and adapt to new data without being assisted by humans. Deep learning techniques enable this automatic learning through the absorption of huge amounts of unstructured data such as text, images, or video. This paragraph is currently getting quite long but I am not sure if it has reached one hundred and fifty words yet, so I will continue to type more sentences about artificial intelligence, machine learning, and deep learning until we cross that arbitrary threshold for testing purposes. We are almost there, just a few more words are required to make this paragraph an absolute wall of text that nobody wants to read on their mobile devices because it hurts their eyes and causes them to lose their place when scrolling.
`;

const result = analyzeSEO(sampleMarkdown);
console.log(JSON.stringify(result, null, 2));
