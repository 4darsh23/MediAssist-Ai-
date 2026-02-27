import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

let model = null;

export async function loadModel() {
  if (model) return model;
  model = await mobilenet.load();
  console.log("MobileNet model loaded!");
  return model;
}

export async function classifyImage(imageElement) {
  const loadedModel = await loadModel();
  const predictions = await loadedModel.classify(imageElement, 5);

  // Map to medical context
  const medicalPredictions = predictions.map((pred) => ({
    label: pred.className,
    confidence: Math.round(pred.probability * 100),
  }));

  return {
    predictedLabel: medicalPredictions[0].label,
    confidence: medicalPredictions[0].confidence,
    allPredictions: medicalPredictions,
    modelName: "MobileNet V2",
    modelType: "CNN (Convolutional Neural Network)",
    inputShape: "224 x 224 x 3",
    totalParameters: "3.4M",
    inferenceTime: null,
  };
}
