import matplotlib.pyplot as plt

# Data
labels = ['Lê Trần Hồng Kông', 'Võ Phương Nam']
# Commits: Hkong (19), Nam (2) -> Total 21
sizes = [19, 2]
colors = ['#4F46E5', '#EF4444'] # Indigo, Red
explode = (0.1, 0)  # explode the 1st slice

plt.figure(figsize=(8, 6))
plt.pie(sizes, explode=explode, labels=labels, colors=colors,
        autopct='%1.1f%%', shadow=True, startangle=140)

plt.axis('equal')  # Equal aspect ratio ensures that pie is drawn as a circle.
plt.title('Team Contribution Breakdown (by Commits)')

plt.savefig('contribution_pie_chart.png')
print("Chart generated successfully.")
