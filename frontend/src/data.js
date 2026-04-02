// SHA-256 hash of the admin password — never store plain text here
export const ADMIN_PASSWORD_HASH = "a41b34442071f446ddfdd9fdca7e5cd3856b0f2de9a091ac26f120c44fdb9b57";

export const intro = {
    para1: "I'm currently building scalable web applications and automation systems with focus on performance, clean architecture and modern UI.",
    para2: "Passionate about solving real-world problems using full-stack development and intelligent automation.",
    thanks: "Thanks for visiting my profile."
};

export const profile = {
    id: 1,
    name: "Praveenkumar ",
    role: "Software Developer",
    description: "I build scalable web applications using React, Node.js and MSSQL."
};

export const skills = [
    { id: 8, skill_name: "Automation", description: "Developing workflow automation and scraping tools" },
    { id: 7, skill_name: "MSSQL", description: "Designing secure and optimized databases" },
    { id: 5, skill_name: "React", description: "Building dynamic and responsive user interfaces" }
];

export const projects = [
    {
        id: 2,
        title: "Laptop Service Booking App",
        description: "Developed a web app for booking laptop repair services with sign-up and login features.\nImplemented an admin panel to manage 100+ bookings using MVC architecture for clean code separation.",
        image_url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
        video_url: "",
        github_url: "https://github.com/j25praveenkumar/laptop-service-booking",
        tech_stack: "React, Node.js, MSSQL"
    },
    {
        id: 1,
        title: "Shipment Tracking Automation System",
        description: "Automated DHL, FedEx, UPS tracking using Python, Selenium and SQL Server with consolidated email reporting.",
        image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d",
        video_url: "https://www.linkedin.com/in/praveenkumar-govindaraj/",
        github_url: "https://github.com/j25praveenkumar",
        tech_stack: "Python, Javascript, SQL Server, SMTP"
    }
];
