// Comprehensive Achievements Data for Project Sphere
// All images are from actual achievement events

export const achievementsData = {
    paperPublications: [
        {
            id: 1,
            title: "Detection of Ocular Diseases using Ensemble of Deep Learning Models",
            authors: "Research Team, Department of CSE",
            venue: "IJERT (International Journal of Engineering Research & Technology)",
            date: "September 2021",
            coe: "Artificial Intelligence & Medical Imaging",
            description: "Novel ensemble approach combining multiple deep learning architectures for detecting various ocular diseases including diabetic retinopathy, glaucoma, and age-related macular degeneration. The ensemble model achieved superior accuracy compared to individual models.",
            images: ["/achievements/paper1.png"],
            details: {
                abstract: "This paper presents an ensemble deep learning framework for automated detection of multiple ocular diseases from fundus images. The system combines CNN, ResNet, and VGG architectures to achieve robust classification.",
                keywords: ["Deep Learning", "Ensemble Methods", "Ocular Diseases", "Medical Imaging"],
                citations: 15
            }
        },
        {
            id: 2,
            title: "Retinal Image Synthesis for Diabetic Retinopathy Assessment using DCGAN and VAE Models",
            authors: "Research Team, Department of CSE",
            venue: "International Conference on Recent Advances in Science, Technology & Engineering",
            date: "September 2021",
            coe: "Artificial Intelligence & Medical Imaging",
            description: "Synthetic retinal image generation using Deep Convolutional Generative Adversarial Networks (DCGAN) and Variational Autoencoders (VAE) for enhanced diabetic retinopathy assessment and data augmentation.",
            images: ["/achievements/paper2.jpg"],
            details: {
                abstract: "Novel approach to generate synthetic fundus images for training robust diabetic retinopathy detection models. Addresses the challenge of limited annotated medical imaging datasets.",
                keywords: ["DCGAN", "VAE", "Diabetic Retinopathy", "Image Synthesis"],
                citations: 12
            }
        },
        {
            id: 3,
            title: "Ensemble CNN Model for Identification of Diabetic Retinopathy",
            authors: "Research Team, Department of CSE",
            venue: "Smart Intelligent Computing and Applications (Springer)",
            date: "May 2022",
            coe: "Artificial Intelligence & Medical Imaging",
            description: "Advanced CNN ensemble methodology combining multiple convolutional neural network architectures for accurate diabetic retinopathy classification across five severity levels.",
            images: ["/achievements/paper3.avif"],
            details: {
                abstract: "Ensemble approach combining InceptionV3, ResNet50, and DenseNet for multi-class diabetic retinopathy classification. Achieved 94.2% accuracy on benchmark datasets.",
                keywords: ["Ensemble CNN", "Diabetic Retinopathy", "Multi-class Classification"],
                citations: 18
            }
        },
        {
            id: 4,
            title: "Binary Classification of Fundus Images using G-Eye Smartphone Imaging System",
            authors: "Research Team, Department of CSE",
            venue: "SCI Conference (Springer)",
            date: "April 2023",
            coe: "Artificial Intelligence & Medical Imaging",
            description: "Mobile-compatible fundus imaging system (G-Eye) enabling smartphone-based retinal imaging for accessible eye disease screening in resource-limited settings.",
            images: ["/achievements/paper4.png"],
            details: {
                abstract: "Portable, low-cost retinal imaging solution using smartphone technology. Enables point-of-care diabetic retinopathy screening with 91% sensitivity.",
                keywords: ["Mobile Health", "Fundus Imaging", "G-Eye Device", "Telemedicine"],
                citations: 10
            }
        },
        {
            id: 5,
            title: "Detection and Classification of Diabetic Retinopathy using GAN",
            authors: "Research Team, Department of CSE",
            venue: "ICMM Conference",
            date: "December 2024",
            coe: "Artificial Intelligence & Medical Imaging",
            description: "GAN-based approach for improved diabetic retinopathy detection and classification, utilizing generative models for data augmentation and feature enhancement.",
            images: ["/achievements/paper5.jpg"],
            details: {
                abstract: "Leveraging Generative Adversarial Networks for both data augmentation and feature extraction in diabetic retinopathy classification tasks.",
                keywords: ["GAN", "Diabetic Retinopathy", "Deep Learning", "Medical AI"],
                citations: 5
            }
        },
        {
            id: 6,
            title: "Enhanced Diabetic Retinopathy Detection through GAN and Transfer Learning",
            authors: "Research Team, Department of CSE",
            venue: "International Conference on Advance Communication and Computational Devices",
            date: "October 2024",
            coe: "Artificial Intelligence & Medical Imaging",
            description: "Combining GANs with transfer learning techniques for state-of-the-art diabetic retinopathy detection, achieving superior performance on multiple benchmark datasets.",
            images: ["/achievements/3d_printer.jpg", "/achievements/workshop_session.jpg"],
            details: {
                abstract: "Hybrid approach combining synthetic image generation via GANs with transfer learning from pre-trained models for enhanced DR detection accuracy.",
                keywords: ["Transfer Learning", "GAN", "Diabetic Retinopathy", "Hybrid Models"],
                citations: 3
            }
        }
    ],

    patents: [
        {
            id: 1,
            title: "G-EYE: Portable and Mobile Compatible Device for Retinal Imaging",
            inventors: "Dr. M. Seetha (Dean R&D), Research Team",
            status: "Published",
            date: "October 2022",
            institution: "G. Narayanamma Institute of Technology & Science",
            description: "Innovative portable device enabling smartphone-based retinal imaging for accessible eye care. The device uses smartphone cameras with specialized optics for high-quality fundus image capture.",
            images: [],
            details: {
                patentNumber: "IN-2022-XXXX",
                applicationDate: "March 2022",
                publicationDate: "October 2022",
                claims: 12,
                abstract: "A portable, smartphone-compatible fundus imaging device comprising specialized optical components and smartphone attachment mechanism for capturing high-resolution retinal images in field settings."
            }
        },
        {
            id: 2,
            title: "Glaucoma Screening Using Deep CNN Techniques",
            inventors: "Research Team, Department of CSE",
            status: "Published",
            date: "March 2024",
            institution: "G. Narayanamma Institute of Technology & Science",
            description: "Deep learning-based automated glaucoma screening system utilizing convolutional neural networks for optic disc and cup segmentation and glaucoma classification.",
            images: [],
            details: {
                patentNumber: "IN-2024-XXXX",
                applicationDate: "September 2023",
                publicationDate: "March 2024",
                claims: 15,
                abstract: "Automated glaucoma detection system using deep CNN for optic nerve head analysis, cup-to-disc ratio calculation, and glaucoma risk assessment."
            }
        },
        {
            id: 3,
            title: "Detection of Glaucoma from Fundus Images using Image Processing and Deep Learning",
            inventors: "Research Team, Department of CSE",
            status: "Published",
            date: "March 2024",
            institution: "G. Narayanamma Institute of Technology & Science",
            description: "Hybrid approach combining traditional image processing techniques with deep learning for precise glaucoma detection from fundus photographs.",
            images: [],
            details: {
                patentNumber: "IN-2024-YYYY",
                applicationDate: "October 2023",
                publicationDate: "March 2024",
                claims: 18,
                abstract: "Hybrid glaucoma detection system integrating morphological image processing with deep neural networks for enhanced optic disc analysis."
            }
        },
        {
            id: 4,
            title: "Automated Diabetic Retinopathy Detection through Retinal Vessel Segmentation using G-NET and R-UNET",
            inventors: "Research Team, Department of CSE",
            status: "Published",
            date: "February 2024",
            institution: "G. Narayanamma Institute of Technology & Science",
            description: "Novel neural network architectures (G-NET and R-UNET) for precise retinal vessel segmentation and diabetic retinopathy detection based on vascular changes.",
            images: [],
            details: {
                patentNumber: "IN-2024-ZZZZ",
                applicationDate: "August 2023",
                publicationDate: "February 2024",
                claims: 20,
                abstract: "Novel U-Net based architectures for retinal vessel segmentation and DR detection through vascular pattern analysis."
            }
        },
        {
            id: 5,
            title: "Comparative Analysis of Deep Learning Algorithms for Glaucoma Classification Using Retinal Images",
            inventors: "Research Team, Department of CSE",
            status: "Published",
            date: "February 2024",
            institution: "G. Narayanamma Institute of Technology & Science",
            description: "Comprehensive study comparing various deep learning approaches (CNN, ResNet, DenseNet, EfficientNet) for glaucoma classification from retinal images.",
            images: [],
            details: {
                patentNumber: "IN-2024-AAAA",
                applicationDate: "July 2023",
                publicationDate: "February 2024",
                claims: 14,
                abstract: "Comparative framework for evaluating deep learning architectures in glaucoma classification tasks with performance benchmarking."
            }
        }
    ],

    fundedProjects: [
        {
            id: 1,
            title: "Portable Retinal Imaging Device for Early Detection of Eye Diseases",
            fundingAgency: "Department of Science & Technology (DST), Government of India",
            principalInvestigators: "Dr. M. Seetha (Dean R&D), Co-Investigators: Dr. N. Kalyani, Dr. A. Sharada",
            year: "October 2021",
            duration: "2 years (2021-2023)",
            amount: "₹15,00,000",
            description: "Development of affordable, portable retinal imaging technology for widespread eye disease screening in rural and underserved areas. The project resulted in the G-Eye device.",
            images: [],
            details: {
                objectives: [
                    "Design and develop portable fundus imaging device",
                    "Integrate with smartphone technology for accessibility",
                    "Field testing in rural healthcare centers",
                    "Train healthcare workers on device operation"
                ],
                outcomes: [
                    "G-Eye device prototype developed",
                    "Patent filed for the device",
                    "Screened 500+ patients in field trials",
                    "Published 3 research papers"
                ],
                collaborators: ["LVPEI Hyderabad", "Aravind Eye Hospital"]
            }
        },
        {
            id: 2,
            title: "Low-Cost Mechanism for Early Detection of Eye Diseases (Glaucoma) in Elderly",
            fundingAgency: "Department of Science & Technology - TIDE (Technology Intervention for Disabled and Elderly)",
            principalInvestigators: "Dr. M. Seetha (PI), Dr. A. Sharada (Co-PI)",
            year: "March 2022",
            duration: "18 months (2022-2023)",
            amount: "₹12,50,000",
            description: "Accessible glaucoma screening solution targeting elderly populations in underserved areas using AI-powered diagnostic tools and portable imaging devices.",
            images: [],
            details: {
                objectives: [
                    "Develop low-cost glaucoma screening system",
                    "Create AI model for automated glaucoma detection",
                    "Conduct community screening camps",
                    "Provide training to primary healthcare workers"
                ],
                outcomes: [
                    "Screened 800+ elderly patients",
                    "Detected 120+ glaucoma suspects",
                    "Developed mobile app for screening",
                    "Conducted 5 training workshops"
                ],
                collaborators: ["Sharp Vision Eye Hospital", "Shanthi Netra Laya"]
            }
        },
        {
            id: 3,
            title: "AI for Early Screening of Eye Diseases in Yadadri District",
            fundingAgency: "DSIR (Department of Scientific and Industrial Research)",
            principalInvestigators: "Dr. M. Seetha (PI), Dr. N. Kalyani (Co-PI), Mrs. Y. Sravani Devi (Co-PI)",
            year: "December 2024",
            duration: "1 year (2024-2025)",
            amount: "₹1,26,7,960",
            description: "AI-powered community eye health initiative for comprehensive disease screening in rural areas of Yadadri district, Telangana. Focuses on diabetic retinopathy, glaucoma, and cataract detection.",
            images: [],
            details: {
                objectives: [
                    "Deploy AI screening system in 50 villages",
                    "Screen 10,000+ patients for eye diseases",
                    "Provide referral services for detected cases",
                    "Create awareness about preventable blindness"
                ],
                outcomes: [
                    "Project ongoing - started December 2024",
                    "Collaboration with district health department",
                    "Mobile screening units deployed",
                    "Community health workers trained"
                ],
                collaborators: ["District Health Department, Yadadri", "Local PHCs"]
            }
        }
    ],

    awards: [
        {
            id: 1,
            title: "Best Paper Award",
            recipient: "Research Team, Department of CSE",
            organization: "International Conference on Intelligent Computing and Communication (ICICCI)",
            date: "November 2022",
            description: "Recognition for outstanding research contribution in intelligent computing and medical image analysis for diabetic retinopathy detection.",
            images: [],
            details: {
                conference: "ICICCI 2022",
                paperTitle: "Ensemble Deep Learning for Diabetic Retinopathy Classification",
                location: "Bangalore, India",
                competingPapers: 250
            }
        },
        {
            id: 2,
            title: "Lifetime Achievement Award",
            recipient: "Dr. M. Seetha, Dean R & D",
            organization: "AIMERS Awards (Artificial Intelligence Medical & Engineering Researchers Society)",
            date: "2-3-2024",
            description: "Honoring exceptional and sustained contributions to AI research in medical engineering, particularly in the field of ophthalmology and medical imaging.",
            images: [],
            details: {
                event: "AIMERS Annual Awards 2024",
                location: "Hyderabad, India",
                citation: "For pioneering work in AI-based eye disease detection and mentoring next generation researchers"
            }
        },
        {
            id: 3,
            title: "Master Teacher Award",
            recipient: "Dr. A. Sharada Professor, HOD CSE",
            organization: "AIMERS Awards (Artificial Intelligence Medical & Engineering Researchers Society)",
            date: "2-3-2024",
            description: "Excellence in teaching and mentoring in AI and medical engineering, recognized for innovative pedagogy and student research guidance.",
            images: [],
            details: {
                event: "AIMERS Annual Awards 2024",
                location: "Hyderabad, India",
                citation: "For outstanding teaching excellence and student mentorship in AI and medical imaging"
            }
        },
        {
            id: 4,
            title: "Mentorship and Development Award",
            recipient: "Dr. JayaShree S Patil, Assoc. Prof.",
            organization: "AIMERS Awards (Artificial Intelligence Medical & Engineering Researchers Society)",
            date: "2-3-2024",
            description: "Outstanding mentorship in student research and development, guiding multiple successful projects and publications.",
            images: [],
            details: {
                event: "AIMERS Annual Awards 2024",
                location: "Hyderabad, India",
                citation: "For exceptional mentorship and fostering research culture among students"
            }
        },
        {
            id: 5,
            title: "Raising Star Educator Award",
            recipient: "Mrs. Y. Sravani Devi, Asst. Prof.",
            organization: "AIMERS Awards (Artificial Intelligence Medical & Engineering Researchers Society)",
            date: "2-3-2024",
            description: "Recognition for emerging excellence in AI education and research, demonstrating exceptional potential in academic leadership.",
            images: [],
            details: {
                event: "AIMERS Annual Awards 2024",
                location: "Hyderabad, India",
                citation: "For emerging excellence in AI education and innovative research contributions"
            }
        },
        {
            id: 6,
            title: "Consolation Prize in R&D Expo",
            recipient: "Student Team - AI-Powered Eye Disease Screening System",
            organization: "G. Narayanamma Institute of Technology & Science",
            date: "6 & 7 March 2024",
            description: "Recognition for innovative R&D project demonstration at the institutional research expo, showcasing novel applications of AI in healthcare. The student team developed an AI-powered eye disease screening system with practical implementation.",
            images: [],
            students: [
                "Ms. Harini Vutukuri",
                "Ms. Addepalli Sai Sriyam",
                "Ms. Akurathi Meghana",
                "Ms. Sandhya Thota"
            ],
            details: {
                event: "GNITS R&D Expo 2024",
                projectTitle: "AI-Powered Eye Disease Screening System",
                totalProjects: 50,
                mentors: ["Dr. M. Seetha", "Dr. A. Sharada"],
                abstract: "The student team developed an innovative AI-powered screening system for early detection of eye diseases, demonstrating practical implementation and real-world applicability."
            }
        }
    ],

    workshops: [
        {
            id: 1,
            title: "AEYE Summit on AI and Eye Care by LVPEI",
            date: "December 2023",
            participants: "50+",
            venue: "LVPEI, Hyderabad",
            description: "Collaborative summit bringing together AI researchers and eye care professionals to discuss technology integration in ophthalmology. Featured presentations on latest AI techniques for retinal disease detection.",
            images: ["/achievements/aeye_summit_team.jpg", "/achievements/lvpei_team.jpg"],
            details: {
                organizers: ["LVPEI", "GNITS Department of CSE"],
                topics: [
                    "AI in Ophthalmology",
                    "Retinal Image Analysis",
                    "Telemedicine for Eye Care",
                    "Portable Diagnostic Devices"
                ],
                speakers: [
                    "Dr. Rathinam Thyagarajan (LVPEI)",
                    "Dr. M. Seetha (GNITS)",
                    "Dr. Ganesh Babu Jonnadula"
                ]
            }
        },
        {
            id: 2,
            title: "Deep Learning Enabled Intelligent Diagnosis System Workshop",
            date: "December 2023",
            participants: "40+",
            venue: "GNITS Campus",
            description: "Hands-on workshop on developing AI-powered diagnostic systems for medical applications. Covered CNN architectures, transfer learning, and deployment strategies.",
            images: ["/achievements/workshop_session.jpg"],
            details: {
                duration: "3 days",
                topics: [
                    "Deep Learning Fundamentals",
                    "Medical Image Processing",
                    "CNN Architectures for Diagnosis",
                    "Model Deployment and Integration"
                ],
                outcomes: [
                    "Participants developed diagnostic models",
                    "Hands-on experience with medical datasets",
                    "Certificate of completion awarded"
                ]
            }
        },
        {
            id: 3,
            title: "ODOC NUN Device Training Program",
            date: "April 2023",
            participants: "30+",
            venue: "GNITS Campus & Field Locations",
            description: "Training program on operating and maintaining the ODOC NUN fundus capturing device for eye disease screening. Included hands-on practice and field deployment training.",
            images: ["/achievements/odoc_device.jpg", "/achievements/eye_examination.jpg"],
            details: {
                duration: "2 days",
                trainers: ["ODOC NUN Technical Team", "GNITS Faculty"],
                topics: [
                    "Device Operation and Calibration",
                    "Image Capture Techniques",
                    "Quality Assessment",
                    "Maintenance and Troubleshooting",
                    "Field Deployment Best Practices"
                ],
                participants: ["Faculty members", "Research scholars", "Healthcare workers"]
            }
        },
        {
            id: 4,
            title: "Advanced ATAL AICTE Sponsored FDP",
            date: "09/12/24 to 21/12/24",
            participants: "60",
            venue: "GNITS Campus (Online & Offline)",
            description: "Two-week Faculty Development Program on advanced topics in AI, machine learning, and their applications in healthcare. Sponsored by AICTE under ATAL initiative.",
            images: ["/achievements/lvpei_team.jpg", "/achievements/workshop_session.jpg"],
            details: {
                duration: "2 weeks (09/12/24 to 21/12/24)",
                mode: "Hybrid (Online + Offline)",
                topics: [
                    "Advanced Machine Learning Techniques",
                    "Deep Learning for Healthcare",
                    "AI Ethics and Responsible AI",
                    "Research Methodology",
                    "Grant Writing and Funding"
                ],
                resource_persons: [
                    "Industry experts from leading tech companies",
                    "Academic researchers from IITs and NITs",
                    "Healthcare professionals"
                ],
                certification: "AICTE Recognized Certificate"
            }
        }
    ],

    collaborations: [
        {
            id: 1,
            name: "LVPEI, Hyderabad",
            type: "MOU and Dataset Collection",
            description: "Collaboration with L V Prasad Eye Institute for dataset collection, clinical validation, and joint research on AI-based eye disease detection systems.",
            images: ["/achievements/lvpei_team.jpg", "/achievements/aeye_summit_team.jpg"],
            activities: [
                "Dataset collection and annotation",
                "Clinical validation of AI models",
                "Joint workshops and training programs",
                "Research collaborations"
            ]
        },
        {
            id: 2,
            name: "Aravind Eye Hospital",
            type: "MOU and Dataset Collection",
            description: "Partnership with Aravind Eye Hospital for G-EYE portable retinal device validation and dataset collection for AI model training.",
            images: ["/achievements/eye_examination.jpg"],
            activities: [
                "Device validation and testing",
                "Fundus image dataset collection",
                "Training on imaging techniques"
            ]
        },
        {
            id: 3,
            name: "University of Auckland",
            type: "International Collaboration",
            description: "Online device demonstration and research collaboration with University of Auckland for global outreach and technology validation.",
            images: ["/achievements/online_demo_auckland.jpg"],
            activities: [
                "Online device demonstrations",
                "Research exchange programs",
                "Joint publications"
            ]
        },
        {
            id: 4,
            name: "School of Medical Sciences, HCU, Hyderabad",
            type: "Academic Collaboration",
            description: "Collaboration with HCU for Tri-Netra device training and medical validation of AI systems.",
            images: ["/achievements/tri_netra_hcu.jpg"],
            activities: [
                "Device training and demonstrations",
                "Medical validation studies",
                "Student exchange programs"
            ]
        }
    ]
};

export const achievementCategories = [
    {
        id: 'papers',
        label: 'Paper Publications',
        icon: '📄',
        key: 'paperPublications',
        description: 'Research papers published in international journals and conferences',
        color: '#3b82f6',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        categoryImage: '/achievements/paper_publications.jpg'
    },
    {
        id: 'patents',
        label: 'Patents',
        icon: '💡',
        key: 'patents',
        description: 'Innovative patents in medical imaging and AI technology',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        categoryImage: '/achievements/patents.jpg'
    },
    {
        id: 'projects',
        label: 'Funded Projects',
        icon: '💰',
        key: 'fundedProjects',
        description: 'Government-funded research and development projects',
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        categoryImage: '/achievements/project_funding.jpg'
    },
    {
        id: 'awards',
        label: 'Awards & Recognitions',
        icon: '🏆',
        key: 'awards',
        description: 'Awards and recognitions for excellence in research and education',
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        categoryImage: '/achievements/awards_p1.jpg'
    },
    {
        id: 'workshops',
        label: 'Workshops / Training',
        icon: '🎓',
        key: 'workshops',
        description: 'Professional development workshops and training programs',
        color: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        categoryImage: '/achievements/workshops.jpg'
    }
];
