// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const MODEL_NAME = 'deepset/roberta-base-squad2'; // QA model

// Replace 'YOUR_HUGGINGFACE_API_TOKEN' with your actual Hugging Face access token
const HUGGINGFACE_API_TOKEN = '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';

/* General Information */
const generalInfo = `
UCSI University is a leading private university in Kuala Lumpur, Malaysia, established in 1986. It offers a wide range of undergraduate and postgraduate programs. The university emphasizes holistic education, encouraging students to participate in extracurricular activities, community service, and entrepreneurial initiatives. For more information, visit the official website at https://www.ucsiuniversity.edu.my/.
`;

/* Faculties and Departments */
const facultiesAndDepartments = `
**Faculties and Departments:**

- **Faculty of Engineering, Technology, and Built Environment**
  - Departments: Civil Engineering, Mechanical Engineering, Electrical & Electronic Engineering, Architecture, Quantity Surveying.

- **Faculty of Medicine and Health Sciences**
  - Departments: Medicine, Pharmacy, Nursing, Optometry, Biomedical Science.

- **Faculty of Business and Management**
  - Departments: Business Administration, Accounting, Finance, Marketing, International Business.

- **Faculty of Social Sciences and Liberal Arts**
  - Departments: Mass Communication, Psychology, English Language & Communication, Education.

- **Faculty of Applied Sciences**
  - Departments: Biotechnology, Food Science & Nutrition, Aquatic Science.

- **Institute of Music**
  - Programs: Classical Music, Contemporary Music, Music Performance, Music Education.

- **Faculty of Hospitality & Tourism Management**
  - Departments: Hospitality Management, Tourism Management, Culinary Arts.

- **Faculty of Creative Arts and Design**
  - Departments: Graphic Design, Fashion Design, Multimedia Design.

- **Institute of Computer Science and Digital Innovation (ICSDI)**
  - Departments: Computer Science, Software Engineering, Information Technology, Data Science.
`;

/* Services and Portals */
const servicesAndPortals = `
**Services and Portals:**

- **IISV2 Student Portal:** The Integrated Information System Version 2 (IISV2) is the main portal for students to access academic information, course registration, and exam results.
  - Website: https://iisv2.ucsiuniversity.edu.my/

- **CN (Course Networking):** An academic social networking platform used for course materials, assignments, and communication between students and lecturers.
  - Website: https://www.thecn.com/

- **Email Services:** Students and staff are provided with UCSI email accounts for official communication.
  - Student Email Format: [studentID]@student.ucsiuniversity.edu.my
  - Staff Email Format: [firstname][lastname]@ucsiuniversity.edu.my

- **Library Services:** Access to a vast collection of physical and digital resources.
  - Website: https://www.ucsiuniversity.edu.my/library

- **Career Services:** Provides guidance and resources for internships and job placements.
  - Email: careerservices@ucsiuniversity.edu.my

- **IT Support:** Assists with technical issues related to university systems and services.
  - Email: ithelpdesk@ucsiuniversity.edu.my

`;

/* Events and Activities */
const eventsAndActivities = `
**Events and Activities:**

- **Annual Career Fair:** Connects students with potential employers.
- **Cultural Festivals:** Celebrating diversity with events like the International Day.
- **Workshops and Seminars:** Regular events on academic and professional development.
- **Student Clubs and Societies:** Over 70 clubs ranging from sports to academic interests.
`;

/* Frequently Asked Questions */
const faqs = `
**Frequently Asked Questions:**

- **How do I apply to UCSI University?**
  - Applications can be submitted online via the university's official website.

- **What are the admission requirements?**
  - Requirements vary by program; generally, undergraduate programs require completion of high school equivalent qualifications.

- **How can I access the student portal?**
  - Visit https://iisv2.ucsiuniversity.edu.my/ and log in with your student credentials.

- **Who do I contact for accommodation services?**
  - Email: accommodation@ucsiuniversity.edu.my

- **What scholarships are available?**
  - Merit-based scholarships are offered. Details can be found on the university website under the 'Scholarships' section.
`;
/* Institute of Computer Science and Digital Innovation (ICSDI) */
const icsdiInfo = `
**Institute of Computer Science and Digital Innovation (ICSDI):**

The ICSDI at UCSI University offers cutting-edge programs in the field of computing and digital innovation. The institute focuses on preparing students for the rapidly evolving tech industry by providing a comprehensive curriculum, industry collaborations, and hands-on experience.

- **Programs Offered:**
  - **Undergraduate Programs:**
    - **Bachelor of Computer Science (Hons)**
      - Specializations:
        - Mobile Computing
        - Network Computing
        - Software Engineering
    - **Bachelor of Software Engineering (Hons)**
      - Emphasis on software development methodologies, project management, and quality assurance.
    - **Bachelor of Information Technology (Hons)**
      - Specializations:
        - Cybersecurity
        - Cloud Computing
    - **Bachelor of Science (Hons) in Data Science**
      - Focus on statistical analysis, data mining, machine learning, and big data technologies.
  - **Postgraduate Programs:**
    - **Master of Computer Science**
      - Advanced studies with research opportunities in various computer science domains.
    - **Ph.D. in Computer Science**
      - Research-intensive program aimed at contributing to scholarly knowledge.

- **Key Areas of Study:**
  - Computer Science
  - Programming Languages (e.g., Java, Python, C++, JavaScript)
  - Software Development and Engineering
  - Data Analytics and Big Data
  - Artificial Intelligence and Machine Learning
  - Cybersecurity and Ethical Hacking
  - Cloud Computing and Virtualization
  - Internet of Things (IoT)
  - Human-Computer Interaction
  - Mobile and Web Application Development

- **Facilities:**
  - **Computer Laboratories:**
    - Equipped with the latest hardware and software technologies.
    - Specialized labs for AI, cybersecurity, cloud computing, and data analytics.
  - **Research Centers:**
    - Centers dedicated to innovation in AI, cybersecurity, and data science.
  - **Innovation Hub:**
    - A collaborative space for students to work on projects, hackathons, and start-up ideas.

- **Industry Collaborations:**
  - Partnerships with leading tech companies like Microsoft, IBM, Google, and Amazon Web Services.
  - Access to industry certifications and training programs.
  - Opportunities for internships, industrial placements, and collaborative projects.
  - Guest lectures and workshops conducted by industry professionals.

- **Academic Staff:**
  - Composed of experienced educators and researchers with industry backgrounds.
  - Active involvement in cutting-edge research and publications.
  - Mentorship programs to support student development.

- **Notable Lecturers:**

  1. **Ts. Dr. Tarak Nandy**
     - **Position:** Head of Department
     - **Expertise:** Computer Networks, Cloud Computing, and Virtualization.
     - **Email:** Tarak@ucsiuniversity.edu.my

  2. **Assoc. Prof. Dr. Chloe Thong Chee Ling**
     - **Position:** Associate Professor
     - **Expertise:** Data Mining, Machine Learning, and Artificial Intelligence.
     - **Email:** chloethong@ucsiuniversity.edu.my

  3. **Asst. Prof. Ts. Dr. Raenu Al Kolandaisamy**
     - **Position:** Director
     - **Expertise:** Information Systems, Database Management, and Business Analytics.
     - **Email:** raenu@ucsiuniversity.edu.my

  4. **Asst. Prof. Ts. Dr. Ghassan Saleh**
     - **Position:** Head of Program
     - **Expertise:** Software Engineering, Agile Development, and Project Management.
     - **Email:** Ghassan@ucsiuniversity.edu.my

  5. **Dr. Lim Wei Kang**
     - **Position:** Senior Lecturer
     - **Expertise:** Artificial Intelligence, Machine Learning, and Robotics.
     - **Email:** limwk@ucsiuniversity.edu.my

  6. **Prof. Tan Soo Yin**
     - **Position:** Professor
     - **Expertise:** Software Architecture, Systems Design, and Quality Assurance.
     - **Email:** tansy@ucsiuniversity.edu.my

  7. **Dr. Chen Mei Ling**
     - **Position:** Senior Lecturer
     - **Expertise:** Data Science, Big Data Analytics, and Statistical Modeling.
     - **Email:** chenml@ucsiuniversity.edu.my

  8. **Dr. Wong Kah Yee**
     - **Position:** Lecturer
     - **Expertise:** Cybersecurity, Ethical Hacking, and Network Security.
     - **Email:** wongky@ucsiuniversity.edu.my

  9. **Dr. Lee Wen Hao**
     - **Position:** Lecturer
     - **Expertise:** Cloud Computing, DevOps, and Infrastructure Management.
     - **Email:** leewh@ucsiuniversity.edu.my

  10. **Dr. Siti Nur Aisyah**
      - **Position:** Lecturer
      - **Expertise:** Human-Computer Interaction and User Experience Design.
      - **Email:** sitinur@ucsiuniversity.edu.my

- **Student Support and Activities:**
  - **Advisory Services:**
    - Academic advising, career counseling, and mentorship.
  - **Clubs and Societies:**
    - Computing Society, Robotics Club, AI and Machine Learning Club, Cybersecurity Club.
  - **Workshops and Seminars:**
    - Regular events on emerging technologies, professional skills, and personal development.
  - **Competitions and Hackathons:**
    - Participation in local and international contests to enhance practical skills.

- **Achievements:**
  - Students have won awards in national and international competitions such as programming contests and hackathons.
  - Alumni employed in top tech companies globally, including Fortune 500 companies.
  - Research contributions in AI, cybersecurity, data analytics, and software engineering.

- **Admission Requirements:**
  - **Undergraduate Programs:**
    - Completion of high school or equivalent with credits in Mathematics and relevant subjects.
    - English proficiency tests like IELTS or TOEFL if applicable.
  - **Postgraduate Programs:**
    - A recognized Bachelor's degree in Computer Science or related field.
    - Research proposal (for Ph.D. applicants).
    - Academic transcripts and letters of recommendation.

- **Contact Information:**
  - **ICSDI General Office Email:** icsdi@ucsiuniversity.edu.my
  - **Phone:** +603-9101 8880
  - **Office Location:** Block A, Level 3, UCSI University Kuala Lumpur Campus.

- **Career Prospects:**
  - Software Developer/Engineer
  - Data Scientist/Analyst
  - Cybersecurity Analyst
  - AI/Machine Learning Engineer
  - Cloud Solutions Architect
  - IT Consultant
  - Mobile Application Developer

- **Frequently Asked Questions:**
  - **How do I apply to ICSDI programs?**
    - Applications can be submitted online via the university's admissions portal at https://www.ucsiuniversity.edu.my/apply-now.
  - **Are there scholarships available for ICSDI students?**
    - Yes, scholarships are available based on academic merit, extracurricular involvement, and other criteria.
  - **Does ICSDI offer part-time or evening classes?**
    - Certain programs may offer flexible scheduling options. Contact the institute for specific details.
  - **What kind of support is available for international students?**
    - Dedicated services for visa applications, accommodation assistance, and orientation programs.
  - **Are there opportunities for research and innovation?**
    - Yes, students are encouraged to participate in research projects and can access resources through research centers.

- **Additional Information:**
  - **Accreditations and Recognitions:**
    - Programs accredited by the Malaysian Qualifications Agency (MQA) and recognized internationally.
  - **Alumni Network:**
    - A strong network of alumni working in various sectors, providing networking opportunities.
  - **Community Engagement:**
    - Involvement in community projects and initiatives promoting digital literacy and technology education.
`;


/* Combine all contexts */
const ucsiContext = `
${generalInfo}
${facultiesAndDepartments}
${servicesAndPortals}
${eventsAndActivities}
${faqs}
${icsdiInfo}
`;

app.post('/api/chat', async (req, res) => {
  try {
    const { input } = req.body;

    // Prepare the payload
    const payload = {
      inputs: {
        question: input,
        context: ucsiContext,
      },
    };

    // Send a request to the Hugging Face Inference API
    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Log the API response for debugging
    console.log('API Response:', data);

    // Check if the API returned an error
    if (data.error) {
      console.error('API Error:', data.error);
      res.status(500).json({ error: data.error });
      return;
    }

    // Extract the bot's reply
    let botReply = data.answer || "I'm sorry, I couldn't find an answer to your question.";

    res.json({ text: botReply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
