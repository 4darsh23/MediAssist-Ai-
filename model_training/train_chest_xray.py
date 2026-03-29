"""
==============================================
  Chest X-Ray Pneumonia Detection - CNN Model
==============================================
Dataset: Kaggle "Chest X-Ray Images (Pneumonia)" by Paul Mooney
URL: https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia

Classes: NORMAL, PNEUMONIA
Architecture: MobileNetV2 + Custom Head (Transfer Learning)
Output: TensorFlow SavedModel + TensorFlow.js model

Instructions:
  1. Download dataset from Kaggle and extract to: model_training/datasets/chest_xray/
     Expected structure:
       datasets/chest_xray/
         train/
           NORMAL/
           PNEUMONIA/
         val/
           NORMAL/
           PNEUMONIA/
         test/
           NORMAL/
           PNEUMONIA/

  2. Install requirements: pip install -r requirements.txt
  3. Run: python train_chest_xray.py
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import json

# ========================
# Configuration
# ========================
CONFIG = {
    "dataset_dir": os.path.join(os.path.dirname(__file__), "datasets", "chest_xray"),
    "output_dir": os.path.join(os.path.dirname(__file__), "saved_models", "chest_xray"),
    "img_size": (224, 224),
    "batch_size": 32,
    "epochs": 25,
    "learning_rate": 0.0001,
    "fine_tune_at": 100,      # Unfreeze layers after this index
    "fine_tune_epochs": 10,
    "fine_tune_lr": 0.00001,
    "class_names": ["NORMAL", "PNEUMONIA"],
}


def create_data_generators(dataset_dir, img_size, batch_size):
    """Create train, validation, and test data generators with augmentation."""

    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.15,
        zoom_range=0.2,
        horizontal_flip=True,
        brightness_range=[0.8, 1.2],
        fill_mode="nearest",
    )

    val_test_datagen = ImageDataGenerator(rescale=1.0 / 255)

    train_gen = train_datagen.flow_from_directory(
        os.path.join(dataset_dir, "train"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="binary",
        shuffle=True,
    )

    val_gen = val_test_datagen.flow_from_directory(
        os.path.join(dataset_dir, "val"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="binary",
        shuffle=False,
    )

    test_gen = val_test_datagen.flow_from_directory(
        os.path.join(dataset_dir, "test"),
        target_size=img_size,
        batch_size=batch_size,
        class_mode="binary",
        shuffle=False,
    )

    return train_gen, val_gen, test_gen


def build_model(img_size, num_classes=1):
    """Build MobileNetV2 transfer learning model."""

    # Load MobileNetV2 pre-trained on ImageNet (without top classification layer)
    base_model = MobileNetV2(
        input_shape=(*img_size, 3),
        include_top=False,
        weights="imagenet",
    )

    # Freeze all base model layers initially
    base_model.trainable = False

    # Build custom classification head
    model = models.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation="relu"),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="sigmoid"),  # Binary classification
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )

    return model, base_model


def fine_tune_model(model, base_model, fine_tune_at, learning_rate):
    """Unfreeze top layers of base model for fine-tuning."""

    base_model.trainable = True

    # Freeze all layers before fine_tune_at
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss="binary_crossentropy",
        metrics=["accuracy", tf.keras.metrics.AUC(name="auc")],
    )

    return model


def plot_training_history(history, history_fine, output_dir):
    """Plot and save training metrics."""

    # Combine histories
    acc = history.history["accuracy"] + history_fine.history["accuracy"]
    val_acc = history.history["val_accuracy"] + history_fine.history["val_accuracy"]
    loss = history.history["loss"] + history_fine.history["loss"]
    val_loss = history.history["val_loss"] + history_fine.history["val_loss"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Accuracy plot
    ax1.plot(acc, label="Train Accuracy")
    ax1.plot(val_acc, label="Val Accuracy")
    ax1.axvline(x=len(history.history["accuracy"]) - 1, color="r", linestyle="--", label="Fine-tuning Start")
    ax1.set_title("Model Accuracy")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Accuracy")
    ax1.legend()
    ax1.grid(True, alpha=0.3)

    # Loss plot
    ax2.plot(loss, label="Train Loss")
    ax2.plot(val_loss, label="Val Loss")
    ax2.axvline(x=len(history.history["loss"]) - 1, color="r", linestyle="--", label="Fine-tuning Start")
    ax2.set_title("Model Loss")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Loss")
    ax2.legend()
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "training_history.png"), dpi=150)
    plt.close()
    print(f"Training history plot saved.")


def evaluate_model(model, test_gen, class_names, output_dir):
    """Evaluate model on test set and generate confusion matrix."""

    # Get predictions
    predictions = model.predict(test_gen)
    y_pred = (predictions > 0.5).astype(int).flatten()
    y_true = test_gen.classes

    # Classification report
    report = classification_report(y_true, y_pred, target_names=class_names)
    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)

    # Save report
    with open(os.path.join(output_dir, "classification_report.txt"), "w") as f:
        f.write(report)

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
                xticklabels=class_names, yticklabels=class_names)
    plt.title("Confusion Matrix - Chest X-Ray")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "confusion_matrix.png"), dpi=150)
    plt.close()
    print("Confusion matrix saved.")

    # Test accuracy
    test_loss, test_acc, test_auc = model.evaluate(test_gen, verbose=0)
    print(f"\nTest Accuracy: {test_acc:.4f}")
    print(f"Test AUC:      {test_auc:.4f}")
    print(f"Test Loss:     {test_loss:.4f}")

    return test_acc, test_auc


def convert_to_tfjs(saved_model_dir, output_dir):
    """Convert SavedModel to TensorFlow.js format."""
    import subprocess

    tfjs_dir = os.path.join(output_dir, "tfjs_model")
    os.makedirs(tfjs_dir, exist_ok=True)

    cmd = [
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        "--saved_model_tags=serve",
        saved_model_dir,
        tfjs_dir,
    ]

    print(f"\nConverting to TensorFlow.js format...")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode == 0:
        print(f"TF.js model saved to: {tfjs_dir}")

        # Save class labels JSON for use in the web app
        labels = {"class_names": CONFIG["class_names"], "model_type": "chest_xray"}
        with open(os.path.join(tfjs_dir, "labels.json"), "w") as f:
            json.dump(labels, f, indent=2)
        print("Labels file saved.")
    else:
        print(f"Conversion failed: {result.stderr}")

    return tfjs_dir


def main():
    print("=" * 60)
    print("  CHEST X-RAY PNEUMONIA DETECTION - MODEL TRAINING")
    print("=" * 60)

    # Check dataset exists
    if not os.path.exists(CONFIG["dataset_dir"]):
        print(f"\n❌ Dataset not found at: {CONFIG['dataset_dir']}")
        print(f"\nPlease download the dataset from:")
        print(f"  https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia")
        print(f"\nAnd extract it to: {CONFIG['dataset_dir']}")
        print(f"\nExpected structure:")
        print(f"  {CONFIG['dataset_dir']}/train/NORMAL/")
        print(f"  {CONFIG['dataset_dir']}/train/PNEUMONIA/")
        print(f"  {CONFIG['dataset_dir']}/val/NORMAL/")
        print(f"  {CONFIG['dataset_dir']}/val/PNEUMONIA/")
        print(f"  {CONFIG['dataset_dir']}/test/NORMAL/")
        print(f"  {CONFIG['dataset_dir']}/test/PNEUMONIA/")
        return

    # Create output directory
    os.makedirs(CONFIG["output_dir"], exist_ok=True)

    # Setup GPU if available
    gpus = tf.config.list_physical_devices("GPU")
    if gpus:
        print(f"\n✅ GPU detected: {gpus[0].name}")
        tf.config.experimental.set_memory_growth(gpus[0], True)
    else:
        print("\n⚠️  No GPU detected. Training will be slower on CPU.")

    # Step 1: Create data generators
    print("\n📁 Loading dataset...")
    train_gen, val_gen, test_gen = create_data_generators(
        CONFIG["dataset_dir"], CONFIG["img_size"], CONFIG["batch_size"]
    )
    print(f"   Training samples:   {train_gen.samples}")
    print(f"   Validation samples: {val_gen.samples}")
    print(f"   Test samples:       {test_gen.samples}")
    print(f"   Classes:            {train_gen.class_indices}")

    # Handle class imbalance
    total = train_gen.samples
    n_normal = np.sum(train_gen.classes == 0)
    n_pneumonia = np.sum(train_gen.classes == 1)
    class_weight = {
        0: total / (2 * n_normal),
        1: total / (2 * n_pneumonia),
    }
    print(f"   Class weights:      {class_weight}")

    # Step 2: Build model
    print("\n🏗️  Building MobileNetV2 model...")
    model, base_model = build_model(CONFIG["img_size"])
    model.summary()

    # Step 3: Training Phase 1 - Train classification head only
    print("\n🚀 Phase 1: Training classification head (base frozen)...")
    training_callbacks = [
        callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-7
        ),
        callbacks.ModelCheckpoint(
            os.path.join(CONFIG["output_dir"], "best_model_phase1.keras"),
            monitor="val_accuracy", save_best_only=True
        ),
    ]

    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=CONFIG["epochs"],
        class_weight=class_weight,
        callbacks=training_callbacks,
    )

    # Step 4: Fine-tuning Phase 2 - Unfreeze top layers
    print(f"\n🔧 Phase 2: Fine-tuning (unfreezing layers after {CONFIG['fine_tune_at']})...")
    model = fine_tune_model(
        model, base_model, CONFIG["fine_tune_at"], CONFIG["fine_tune_lr"]
    )

    fine_tune_callbacks = [
        callbacks.EarlyStopping(
            monitor="val_accuracy", patience=5, restore_best_weights=True
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=3, min_lr=1e-8
        ),
        callbacks.ModelCheckpoint(
            os.path.join(CONFIG["output_dir"], "best_model_final.keras"),
            monitor="val_accuracy", save_best_only=True
        ),
    ]

    history_fine = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=CONFIG["fine_tune_epochs"],
        class_weight=class_weight,
        callbacks=fine_tune_callbacks,
    )

    # Step 5: Evaluate on test set
    print("\n📊 Evaluating on test set...")
    test_acc, test_auc = evaluate_model(
        model, test_gen, CONFIG["class_names"], CONFIG["output_dir"]
    )

    # Step 6: Save model
    saved_model_dir = os.path.join(CONFIG["output_dir"], "saved_model")
    model.save(saved_model_dir)
    print(f"\n💾 SavedModel saved to: {saved_model_dir}")

    # Step 7: Plot training history
    plot_training_history(history, history_fine, CONFIG["output_dir"])

    # Step 8: Convert to TensorFlow.js
    tfjs_dir = convert_to_tfjs(saved_model_dir, CONFIG["output_dir"])

    # Summary
    print("\n" + "=" * 60)
    print("  TRAINING COMPLETE!")
    print("=" * 60)
    print(f"  Test Accuracy:  {test_acc:.4f}")
    print(f"  Test AUC:       {test_auc:.4f}")
    print(f"  SavedModel:     {saved_model_dir}")
    print(f"  TF.js Model:    {tfjs_dir}")
    print(f"  Classes:        {CONFIG['class_names']}")
    print("=" * 60)
    print(f"\n  Copy the tfjs_model folder to your Next.js public/ directory:")
    print(f"    public/models/chest_xray/")


if __name__ == "__main__":
    main()
