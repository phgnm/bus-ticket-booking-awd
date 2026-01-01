import matplotlib.pyplot as plt

# Data
labels = ['Lê Trần Hồng Kông (Hkong-2)', 'Võ Phương Nam (phgnm)']
# Based on qualitative analysis of feature ownership and code complexity:
# Hkong: Frontend Lead (UI/UX, Admin Dashboard, Client Logic) ~ 50%
# Nam: Backend Lead (Architecture, DevOps, Payment/AI/Redis Integrations) ~ 50%
sizes = [50, 50]
colors = ['#4F46E5', '#EF4444'] # Indigo, Red
explode = (0.05, 0.05)  # slight separation for equality

plt.figure(figsize=(8, 6))
plt.pie(sizes, explode=explode, labels=labels, colors=colors,
        autopct='%1.1f%%', shadow=True, startangle=90)

plt.axis('equal')
plt.title('Team Contribution Estimate (Role-Based)')

plt.savefig('contribution_pie_chart.png')
print("Chart generated successfully.")
