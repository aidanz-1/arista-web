<script lang="ts">
	import { Accordion, AccordionItem } from "$lib/skeleton-compat";
</script>

<Accordion class="faq-accordion">
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">What is ARISTA?</h3>
		{/snippet}
		{#snippet content()}
			<section class=" w-full text-token space-y-4">
				<p>
					ARISTA is Stuyvesant High School’s premier honor society. We strive to become positive
					role models as we proudly serve our communities by upholding our four pillars of
					character, leadership, scholarship, and service. Not only are our handpicked members—some
					of the most diligent and morally upright students within Stuyvesant—the backbone of the
					academic support system within Stuyvesant, but we are also a coveted volunteer force that
					positively permeates the greater New York City community.
				</p>
				<p>
					Despite the sometimes overwhelming amount of obligations and commitments our members have,
					we, high school students, are perhaps one of the most reliable volunteer groups in the
					country—not because we have more time than anyone else, but because we make time for the
					causes we care about.
				</p>
			</section>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">What are the services we offer?</h3>
		{/snippet}
		{#snippet content()}
			<section class="w-full text-token space-y-4">
				<div>
					<h4 class="h4">In-House Academic Support</h4>
					<ul class="mt-1 list-disc list-inside [&_ul]:list-[revert]">
						<li>
							<span class="font-bold underline">Peer Tutoring:</span> ARISTA offers Stuyvesant
							students one-on-one peer tutoring with a member skilled in the requested subject. Once
							paired through our website, a session is self-coordinated between the tutor and tutee
							to ensure utmost flexibility. Thus, sessions can occur anywhere and at any time:
							before school, during free periods, after school, during the weekend, and even
							virtually. Request a tutor here:
							<a class="anchor" href="/tutoring">stuyarista.org/tutoring</a>.
						</li>
						<li>
							<span class="font-bold underline">Study Guides:</span> Our database of study guides
							ranges across all subjects and grades and is the accumulation of a procured collection
							of guides submitted by our academically stellar members over the past few years. The
							database has study guides of various formats, including Quizlets, Kahoots, Google
							Docs, Notion, and more; we have been making an effort in recent years to include a
							greater variety to ensure we are supporting students of all learning types. Find our
							database at this link:
							<a class="anchor" href="/studyguides">stuyarista.org/studyguides</a>.
						</li>
						<li>
							<span class="font-bold underline">Long-term Partnerships:</span> We have established
							long-term partnerships with several organizations within Stuyvesant such as with the
							<a href="http://wc.stuy.edu" class="anchor">Writing Center</a>
							and the CSDojo. A portion of our members consistently volunteer with these organizations
							to provide academic support to Stuyvesant students.
							<ul class="list-inside ml-5">
								<li>
									The CSDojo (room 307) is open from Mondays to Thursdays from right after school to
									5 PM.
								</li>
							</ul>
						</li>
					</ul>
				</div>
				<div>
					<h4 class="h4">Community Service</h4>
					<ul class="mt-1 list-disc list-inside [&_ul]:list-[revert]">
						<li>
							Within Stuyvesant, ARISTA members facilitate in-school events, such as open houses,
							Camp Stuy, the college fair, and more.
						</li>
						<li>
							Our members volunteer at dozens of one-off events weekly around the city. If you are
							an organization and would like us to volunteer with you, please email
							aristaeventscommittee@gmail.com.
							<ul class="list-inside ml-5">
								<li>
									Some of our 2025 - 2026 service partners:
									<ul class="list-inside ml-5">
										<li>9 Million Reasons</li>
										<li>W72 Association</li>
										<li>PS 150</li>
										<li>It’s My Park</li>
										<li>Masbia of Queens</li>
										<li>Xavier’s Mission Soup Kitchen</li>
										<li>Margaret Tietz Nursing Home</li>
										<li>Community Church of New York</li>
										<li>Ralph Ellison Memorial</li>
										<li>MoMath</li>
										<li>Inform Your Community</li>
										<li>DOROT</li>
										<li>and more…</li>
									</ul>
								</li>
							</ul>
						</li>
						<li>
							Our long-term partnerships, such as with the Prescod Institute for Sport, Teamwork,
							and Education (PISTE), allow a subset of our members to consistently volunteer with
							these organizations to provide academic support to students around the city.
						</li>
					</ul>
				</div>
			</section>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">How/when do I apply to join ARISTA?</h3>
		{/snippet}
		{#snippet content()}
			<section class="w-full text-token space-y-4">
				<p>
					Applications to join ARISTA open every spring. Freshmen, sophomores, and junior Stuyvesant
					students with a 92 overall GPA (no exceptions will be made, not even if you are a tenth
					off) are eligible to apply.
				</p>
				<p>
					Our application consists of two rounds: if you pass our written application (<a
						class="anchor"
						href="/apply">stuyarista.org/apply</a
					>) which consists of an extracurricular section and a few essays, you will be called for
					an interview with the executive council.
				</p>
				<p>
					Although our application process is intense and selective, we encourage all eligible
					students to apply (or reapply!). Our application process is quite similar to the college
					admissions process, and we have heard positive feedback from our members who agree that
					our application process has assisted them in gaining experience before applying to college
					or other programs.
				</p>
			</section>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Where can I access ARISTA study guides?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Find our database of study guides at this link: <a class="anchor" href="/studyguides"
					>stuyarista.org/studyguides</a
				>.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Help! I forgot my ARISTA password.</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Use <a class="anchor" href="/forgot-password">Forgot password</a> on the sign-in page. We'll
				email you a link to choose a new one. If the email doesn't arrive, check your spam folder,
				then email
				<a href="mailto:stuyaristanycweb@gmail.com" class="anchor">stuyaristanycweb@gmail.com</a>.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">I have another question. Who can I contact?</h3>
		{/snippet}
		{#snippet content()}
			<p>For any inquiries not addressed here, please refer to the following contacts:</p>
			<ul class="mt-1 list-disc list-inside [&_ul]:list-[revert]">
				<li>
					stuyaristanyc@gmail.com<br />Aidan Zeleniy, President<br />This is the main contact for
					anything ARISTA-related that doesn’t fit into the other categories. If you’re not sure who
					to email, start here.
				</li>
				<li>
					stuyaristanycops@gmail.com<br />Emma Musyuk, Vice President of Operations<br />For
					questions about tutoring logistics, credit tracking, study guides, academic resources,
					PISTE, or anything related to how ARISTA runs behind the scenes. If you’re an ARISTA
					member with concerns about your credits, this is the place to ask.
				</li>
				<li>
					stuyaristanycevents@gmail.com<br />Eric Lam, Vice President of Events &amp; Service<br
					/>If you have questions about an ARISTA event, whether it's logistics, sign-ups, or a
					credit discrepancy, email here. If your question is about a specific event, it helps to
					reach out to the event leader directly.
				</li>
				<li>
					stuyaristanycweb@gmail.com<br />Mekot Sarder, Vice President of Web Development<br />For
					any problems with the ARISTA website, suggestions for improvements, or updates that need
					to be made. If something looks off or isn't working, let us know.
				</li>
			</ul>
		{/snippet}
	</AccordionItem>

	<!-- TUTORING SECTION -->
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Tutoring: Making a request</h3>
		{/snippet}
		{#snippet content()}
			<ol class="list-decimal ml-5 space-y-2">
				<li>
					Register for an account at <a class="anchor" href="/register">stuyarista.org/register</a>.
				</li>
				<li>
					Create a tutoring request at <a class="anchor" href="/tutoring">stuyarista.org/tutoring</a
					>.
				</li>
				<li>
					Please be as specific as possible when describing what you need help with and when you can
					meet (remember that you can also meet virtually on zoom, on the weekends, after school,
					however you’d like!)
				</li>
				<li>
					You can submit as many different requests as you would like. Making the same request for
					the same topic multiple times will not increase the chance of it getting selected.
				</li>
				<li>
					You will see your request under “Your open requests” on the Request help tab. Once a tutor
					picks it, it moves to “Your sessions”, where you can message them. Your tutor should reach
					out to you soon after selecting your request; if they do not, please email the Operations
					team at <a href="mailto:stuyaristanycops@gmail.com" class="anchor"
						>stuyaristanycops@gmail.com</a
					>.
				</li>
				<li>
					We'll email you when a tutor picks your request, and if a message from them goes unread
					for a few hours.
				</li>
				<li>
					After your session, open “Your sessions” and use “Log hours” to enter how long you met,
					rounded to the nearest tenth of an hour. Keep an eye out for a new feature dropping soon
					where you will be able to rate your tutor! This helps us improve as an organization, so we
					appreciate your feedback.
				</li>
				<li>
					If you found the tutor to be extremely engaging and helpful, talk to them and see if they
					are willing to work with you for a few more sessions (be a “recurring tutor”). If so, do
					not complete the session, and just finish the tutoring session towards the end of the
					semester with the total amount of time you were tutored for.
				</li>
				<li>
					Make more requests following the steps above! Tell your friends about ARISTA and let us
					know if you have any feedback.
				</li>
			</ol>
			<p class="mt-4"><strong>How to sign up for an ARISTA tutor 2024 - 2025</strong></p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">What type of things can I request help for?</h3>
		{/snippet}
		{#snippet content()}
			<p>Anything! These are the types of things ARISTA tutors have assisted with in the past:</p>
			<ul class="list-disc ml-5">
				<li>test preparation</li>
				<li>quiz preparation</li>
				<li>general study skills</li>
				<li>projects</li>
				<li>homework</li>
				<li>classwork</li>
				<li>assignments</li>
				<li>More!</li>
			</ul>
			<p>
				Most students tend to request ARISTA tutors to help prepare for an upcoming examination in
				one of their classes, especially as your requests can take anywhere from a day to a week to
				be selected (no guarantees, as this depends on the timing of the year and caseload of our
				tutors).
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">How many tests/subjects can my tutor help me with for one request?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Although you technically can ask for help in multiple subjects in one request, we suggest
				for you to make separate requests for each subject/unit/test you need help with, as this
				makes it more likely for your request to be selected quickly by our tutors. In general, the
				more specific the request is, the quicker you will be matched with someone.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Where are tutoring sessions held?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Tutoring sessions can be held at school, after school, or over Zoom. You will arrange with
				your tutor for a time and place that works for both of you.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">How long should my tutoring session last?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				The duration of your tutoring session is flexible and dependent on what is agreed upon
				between you and your tutor. In general, our sessions last anywhere from a period to two
				hours.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Do I need to prepare for my tutoring session?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				To maximize the tutoring experience, we suggest for you to send relevant material (i.e.
				homework/classwork problems, unit review packets, class scaffolds) to the tutor before the
				session. The more you send, the better your session! If you want help studying for a test,
				inform your tutor of everything your teacher told you regarding the test’s content and
				format.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Are ARISTA tutoring sessions recurring or one-off?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Both! Although sessions tend to be one-off, if you found the tutor to be extremely engaging
				and helpful, talk to them and see if they are willing to work with you for a few more
				sessions (be a “recurring tutor”). If so, do not complete the session, and just finish the
				tutoring session towards the end of the semester with the total amount of time you were
				tutored for.
			</p>
			<p>
				If you are looking for a recurring tutor, email the Operations team at <a
					href="mailto:stuyaristanycops@gmail.com"
					class="anchor">stuyaristanycops@gmail.com</a
				> and they will see if they can pair you with someone long term.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">
				If my tutor agrees to work with me recurrently, do I have to make multiple requests?
			</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Nope! Just do not complete the original session, and finish the tutoring session towards the
				end of the semester or when you no longer need help (make sure to let your tutor know!) with
				the total amount of time you were tutored for.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">How should I complete a tutoring request?</h3>
		{/snippet}
		{#snippet content()}
			<ol class="list-decimal ml-5 space-y-2">
				<li>Go to <a class="anchor" href="/tutoring">stuyarista.org/tutoring</a>.</li>
				<li>
					Under “Your sessions”, enter the amount of time you met with your tutor to the nearest
					tenth of an hour.
				</li>
				<li>Click “Log hours”.</li>
			</ol>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">How do I calculate the total duration? What do I round to?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Calculate the total duration by dividing the total amount of minutes by 60, and rounding to
				the nearest tenth.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">
				What should I input for the duration of our session if it lasted one Stuyvesant period?
			</h3>
		{/snippet}
		{#snippet content()}
			<p>
				In general, one full Stuyvesant period should be inputted as 0.7. If the session lasted more
				for half an hour, you may input 0.5.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Is there a limit to the amount of tutoring sessions I can have?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Nope! If you need more tutoring sessions in the same subject or a different subject, feel
				free to keep making requests. We highly encourage this!
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">My tutor isn’t responding to my emails.</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Please send a follow up email. If you are still having issues with an unresponsive tutor,
				please email <a href="mailto:stuyaristanycops@gmail.com" class="anchor"
					>stuyaristanycops@gmail.com</a
				> for assistance.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">What do I do if I no longer need a tutoring session?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				If no one has picked your request yet, open the Request help tab on the
				<a class="anchor" href="/tutoring">tutoring page</a> and click “Withdraw” next to it under “Your
				open requests”. If a tutor already picked it, message them on the session to let them know you
				no longer need help, and ask them to cancel the session.
			</p>
		{/snippet}
	</AccordionItem>
	<AccordionItem>
		{#snippet summary()}
			<h3 class="h3">Can I request a specific tutor?</h3>
		{/snippet}
		{#snippet content()}
			<p>
				Please contact your guidance counselor and <a
					href="mailto:stuyaristanycops@gmail.com"
					class="anchor">stuyaristanycops@gmail.com</a
				>, cc-ing your preferred tutor with a valid reason and see if your request is approved.
			</p>
		{/snippet}
	</AccordionItem>
</Accordion>
