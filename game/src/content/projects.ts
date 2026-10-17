import type { ProjectItem } from './site';

/**
 * Projects shown in the town that aren't on the classic site (index.html) yet.
 * EDIT freely. If you later add one of these to index.html, the extracted
 * version wins automatically (it's looked up first).
 */
export const extraProjects: ProjectItem[] = [
  {
    id: 'karura',
    title: 'Karura',
    tagline: 'Software & Computer Vision Engineer, TAMU Karura Mars Rover Team. Object detection for autonomous navigation on a Texas A&M/Japan University Rover Challenge team.',
    date: 'Jan 2026 – Present',
    bullets: [
      'Benchmarked 5 object detection models (YOLOv8, YOLO11, YOLO26 and RF-DETR variants) with a reproducible evaluation pipeline that scores every model with one shared COCO metric scorer.',
      'Selected RF-DETR-N at 0.84 mAP@50, a 33% improvement over the best YOLO baseline (0.63), with 2–3× higher mAP@50 on small objects.',
      'Defined evaluation requirements and a weighted scoring matrix covering accuracy, detection range, small-object performance, false positives, onboard speed and licensing.',
      'Built the training and test dataset by merging four public URC datasets from Roboflow Universe and holding out one team’s full dataset as an unseen test set.',
      'Ran a camera resolution sweep that kept mAP@50 within 0.01 from 720p to 480p while cutting transmitted pixels by 55%, reducing bandwidth on the rover’s multi-camera wireless link.',
      'Trained models on the TAMU VISION GPU cluster and deployed them with TensorRT on NVIDIA Jetson hardware.',
    ],
    tags: ['Computer Vision', 'Object Detection', 'RF-DETR', 'YOLO', 'COCO Metrics', 'Roboflow', 'TensorRT', 'NVIDIA Jetson'],
    link: null,
  },
];
