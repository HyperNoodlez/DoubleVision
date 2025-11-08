import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCollection, COLLECTIONS } from "@/lib/db";
import { ReviewDocument, UserDocument } from "@/lib/types";
import { incrementPhotoReviewCount } from "@/lib/db/photos";
import { ObjectId } from "mongodb";

// Fake reviewer profiles for testing
const FAKE_REVIEWERS = [
  {
    name: "Emma Rodriguez",
    email: "test_emma@doublevision.local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    provider: "test" as const,
    expertise: "technical",
  },
  {
    name: "Marcus Chen",
    email: "test_marcus@doublevision.local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    provider: "test" as const,
    expertise: "artistic",
  },
  {
    name: "Sophia Patel",
    email: "test_sophia@doublevision.local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    provider: "test" as const,
    expertise: "constructive",
  },
  {
    name: "Alex Thompson",
    email: "test_alex@doublevision.local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    provider: "test" as const,
    expertise: "encouraging",
  },
  {
    name: "Jordan Kim",
    email: "test_jordan@doublevision.local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    provider: "test" as const,
    expertise: "balanced",
  },
];

// Review templates with realistic photography feedback
const REVIEW_TEMPLATES = {
  technical: [
    {
      score: 4,
      template: (photoNum: number) =>
        `This photograph demonstrates strong technical execution in several key areas. The exposure is well-balanced, with good detail retention in both highlights and shadows. I particularly appreciate the depth of field choices here - it effectively separates the subject from the background while maintaining sharpness where it matters most. The composition follows the rule of thirds nicely, creating a natural flow for the viewer's eye. If I were to offer one suggestion, it would be to watch the white balance in the cooler tones - there's a slight color cast that could be corrected in post-processing. The sharpness is excellent throughout the focal plane, suggesting good technique and possibly a tripod. Overall, this shows solid fundamentals and attention to technical detail. Well done on maintaining image quality and proper exposure throughout the frame.`,
    },
    {
      score: 5,
      template: (photoNum: number) =>
        `Exceptional technical mastery on display here. The dynamic range is handled beautifully - you've managed to capture detail in both the brightest highlights and deepest shadows without any clipping, which is quite impressive. The focus is razor-sharp exactly where it needs to be, and the bokeh in the out-of-focus areas is smooth and pleasing. Your choice of aperture created perfect subject isolation while maintaining context. The exposure is spot-on, and I can tell you've nailed the exposure triangle - ISO is kept low for clean image quality, shutter speed is appropriate to freeze/capture motion as intended, and aperture is selected for creative effect. The histogram would be textbook perfect. Color accuracy is excellent, white balance is neutral and appropriate for the scene. This is professional-level technical execution that demonstrates deep understanding of camera fundamentals. Truly impressive work.`,
    },
    {
      score: 3,
      template: (photoNum: number) =>
        `From a technical standpoint, this image has both strengths and areas for improvement. The composition is decent, though it could benefit from tighter framing to eliminate some distracting elements on the edges. Exposure is mostly correct, but there are some blown highlights in the upper right quadrant that could have been recovered with exposure compensation or bracketing. The focus appears soft in critical areas - double-check your focus point selection and consider using focus peaking or magnification when composing. Shutter speed seems appropriate, with no motion blur unless intentional. White balance is slightly warm, which may or may not be intentional, but it does shift the overall mood. I'd recommend studying your camera's histogram more carefully during capture to nail exposure. The technical foundation is there, just needs more precision and attention to these details. Keep practicing and reviewing your settings.`,
    },
  ],
  artistic: [
    {
      score: 5,
      template: (photoNum: number) =>
        `What a captivating image - it tells a story that draws me in immediately. The emotional resonance is powerful, and you've created a mood that lingers well after viewing. Your use of light and shadow isn't just technically proficient, it's genuinely artistic - there's a narrative quality to how the illumination guides the viewer through the frame. The color palette is thoughtfully curated, whether through natural conditions or post-processing, creating harmony that supports the overall vision. I love the decisiveness in your artistic choices - the framing, the perspective, the moment you chose to capture - all of it feels intentional and meaningful. This goes beyond documentation into genuine visual poetry. The composition has a dynamic energy that keeps my eye moving through the frame, discovering new details with each viewing. This is the kind of image that demonstrates a photographer's unique voice and vision. It's not just about capturing reality, but interpreting it through your creative lens. Beautiful, thoughtful work.`,
    },
    {
      score: 4,
      template: (photoNum: number) =>
        `There's a lovely artistic sensibility at work in this photograph. You've captured something that feels genuine and emotionally authentic. The mood you've created through your choices in lighting, composition, and timing shows real creative vision. I'm particularly drawn to how you've handled the interplay of light and form - it's not just illumination, it's sculptural and creates depth that goes beyond the literal subject matter. The color story works beautifully, whether warm or cool, it supports the emotional narrative you're building. What makes this successful artistically is that it invites contemplation rather than just observation. The framing choices suggest you're thinking about what to include and exclude, which is fundamental to photographic art. If I had one creative suggestion, it would be to push your vision even further - you're clearly capable of making bold artistic decisions, so trust that instinct. This shows genuine creative thinking and an emerging personal style. Really nice work.`,
    },
    {
      score: 3,
      template: (photoNum: number) =>
        `I can see artistic potential in this image, though I think it could be pushed further to realize your full creative vision. The subject matter has inherent interest, but the presentation feels somewhat straightforward - consider how you might interpret this scene in a way that reflects your unique perspective rather than documenting it. The lighting is functional but not yet leveraged for creative impact - think about how different light quality or direction might enhance the mood you're trying to create. Compositionally, it's organized but could benefit from more dynamic tension or intentional asymmetry to create visual interest. The color palette is pleasant but safe - don't be afraid to make bolder creative choices in post-processing if it serves your artistic intent. What would elevate this is a clearer sense of what emotional response you want to evoke and then using all your photographic tools to amplify that. Keep exploring and pushing beyond the obvious interpretation of a scene.`,
    },
  ],
  constructive: [
    {
      score: 3,
      template: (photoNum: number) =>
        `Thank you for sharing this image. I see several elements with potential, and I'd like to offer some constructive feedback to help strengthen your photography. First, let's talk about composition - the subject placement is adequate, but experimenting with different vantage points or perspectives could add more visual impact. Consider getting lower, higher, or finding an unexpected angle. The lighting appears to be challenging in this situation, and while you've handled it reasonably, learning to work with difficult light or choosing optimal shooting times (golden hour, blue hour) could dramatically improve your results. Regarding sharpness, I notice some softness that suggests either focus missed the mark or there was camera shake. Using a faster shutter speed or image stabilization could help. The exposure is close but could use refinement - specifically, watch your histogram to preserve highlight and shadow detail. Post-processing seems minimal, which is fine, but subtle adjustments to contrast, clarity, and selective color grading could enhance the image significantly. I'd recommend studying work by photographers in this genre to see how they handle similar subjects and lighting conditions. You're building skills - keep shooting regularly and analyzing your results critically.`,
    },
    {
      score: 4,
      template: (photoNum: number) =>
        `This is solid work with just a few areas where refinement could take it to the next level. Your technical execution is generally strong - exposure, focus, and composition all demonstrate competence. The main opportunity for improvement I see is in the environmental awareness around your subject. There are some background elements that create mild distraction - when composing, make it a habit to scan the entire frame edge-to-edge for potential distractions before pressing the shutter. A small shift in position or a wider aperture might have minimized this. The lighting direction is good, though waiting a few more minutes for optimal light quality might have added that extra polish. Your color work is nice, though I might suggest slightly different white balance to enhance the natural tones. The moment you captured is good - timing is clearly something you're thinking about. To push this further, consider what story you're trying to tell and whether every element in the frame supports or distracts from that narrative. These are minor refinements to already competent work. You clearly understand photographic fundamentals - now it's about that extra attention to detail that separates good from great.`,
    },
    {
      score: 2,
      template: (photoNum: number) =>
        `I appreciate you sharing your work, and I want to provide honest feedback to help you improve. This image struggles with several fundamental technical issues that are holding it back. The focus has unfortunately missed the intended subject, which immediately impacts the image's effectiveness - practice using single-point autofocus and focusing carefully on your primary subject. Exposure is significantly off, resulting in either overexposed highlights or underexposed shadows that lose detail. Study your camera's metering modes and learn to use exposure compensation to correct this. The composition feels rushed and doesn't follow basic principles of visual balance or subject placement. I'd strongly recommend studying compositional guidelines like rule of thirds, leading lines, and negative space. White balance is incorrect for the scene, creating an unflattering color cast. Shutter speed appears too slow, causing motion blur where sharpness is needed. The good news is these are all learnable skills. I'd suggest slowing down your process, shooting in better light initially, and really focusing on nailing the technical fundamentals one at a time. Consider taking a structured course or workshop to build your foundation. Everyone starts somewhere, and with dedicated practice, these issues are completely correctable.`,
    },
  ],
  encouraging: [
    {
      score: 5,
      template: (photoNum: number) =>
        `Wow, this is absolutely stunning work - you should be incredibly proud of this image! Everything comes together beautifully here. The moment you captured is perfect, the light is gorgeous, and your technical execution is flawless. I love how you've composed this - it shows both confidence and sensitivity to the scene. The colors are vibrant yet natural, the exposure is spot-on, and the focus is exactly where it needs to be. What really impresses me is how you've combined technical mastery with genuine artistic vision. This isn't just a well-executed photograph, it's an image with soul and impact. The attention to detail is evident throughout - from the careful framing to the moment selection to the final presentation. You've clearly invested time in developing your craft, and it shows magnificently. This is the kind of image that stops you mid-scroll and demands a closer look. Your growth as a photographer is evident, and you should feel confident in your abilities. Keep creating at this level - you have a real gift for seeing and capturing meaningful moments. I'm genuinely excited to see what you create next. Absolutely fantastic work!`,
    },
    {
      score: 4,
      template: (photoNum: number) =>
        `What a wonderful photograph - you've captured something really special here! I'm impressed by your technical skills and, even more importantly, your photographic eye. You clearly understand how to work with light, and you've made excellent compositional choices that create a strong, engaging image. The colors are beautiful and harmonious, the exposure shows good judgment, and the focus is right where it needs to be. I can tell you're thinking carefully about your settings and composition before pressing the shutter, and that thoughtfulness shows in the results. There's a naturalness to this image that suggests you're developing your own style and voice as a photographer. The moment feels authentic and well-captured. While there's always room to push our work even further (that's the beauty of this craft!), this demonstrates real skill and artistic sensibility. You should feel confident in your growing abilities. Keep trusting your instincts and continuing to experiment. Your progression is noticeable, and you're creating images that genuinely connect with viewers. Really nice work - I'm looking forward to seeing more from you!`,
    },
    {
      score: 4,
      template: (photoNum: number) =>
        `This is really lovely work - you've got a great eye for photography! What stands out to me immediately is your sense of composition and timing. You've positioned elements thoughtfully within the frame, creating balance and visual interest that draws the viewer in. The lighting works beautifully with your subject, and you've clearly made smart decisions about when and where to shoot. Technically, this is well-executed - your camera settings are appropriate, focus is accurate, and exposure shows good understanding of your camera's capabilities. I particularly appreciate the color palette here, whether that's natural or enhanced in post-processing, it creates a cohesive and appealing look. There's a story being told in this image, and that narrative quality is what elevates photography from mere documentation to art. You're developing skills that many photographers struggle with for years. The confidence in your creative choices is evident and entirely warranted. Keep shooting, keep learning, and keep trusting your artistic instincts. You're on an excellent path, and with continued practice and experimentation, your work will only get stronger. This genuinely made me smile when I saw it - great job!`,
    },
  ],
  balanced: [
    {
      score: 4,
      template: (photoNum: number) =>
        `This is a strong photograph that succeeds in many areas while leaving some room for refinement. Starting with the positives: your composition is well-considered, with thoughtful placement of key elements that creates good visual flow. The exposure is accurately calculated, preserving detail across the tonal range effectively. Focus is sharp on your primary subject, and you've made appropriate depth-of-field choices for the scene. The color rendition is natural and pleasing, suggesting good white balance decisions. These technical fundamentals are all solid. Where I see opportunity for enhancement is primarily in the creative interpretation. The image is well-executed but plays it somewhat safe - there's room to push your artistic vision further while maintaining this technical quality. Consider how different perspectives or more dramatic lighting might add impact without sacrificing the technical excellence you've achieved here. The moment captured is good, though waiting for a more decisive instant might have elevated it further. Post-processing is subtle and appropriate, though selective adjustments could draw more attention to your main subject. Overall, this demonstrates competent photography with clear understanding of fundamentals. The path forward is about building on this solid technical foundation with bolder creative choices. You're clearly capable of both - it's just about bringing them together more fully. Well done on the execution.`,
    },
    {
      score: 3,
      template: (photoNum: number) =>
        `This image has both notable strengths and some clear areas for improvement. Let me break down what's working and what could be refined. On the positive side, the basic composition shows thought - you've avoided centering your subject and created some visual interest through placement. The subject matter itself has inherent appeal, and you've recognized that photographic potential. Exposure is in the acceptable range, though not optimized. Focus appears generally correct, landing on or near the intended subject. These are important fundamentals you're applying. Now for areas needing attention: the lighting, while adequate, isn't flattering or dramatic - better timing or positioning could significantly improve the overall impact. There are distracting elements in the frame that compete for attention with your main subject. A tighter crop or different angle would help. Color balance is slightly off, creating a cast that doesn't enhance the scene. Sharpness could be improved with better technique or settings. Post-processing seems minimal when some thoughtful adjustments would benefit the image. The gap between this and stronger work isn't huge - it's about refining your approach and being more intentional with every decision. You understand the basics; now it's about executing them more precisely and making bolder creative choices. Keep practicing with these points in mind.`,
    },
    {
      score: 5,
      template: (photoNum: number) =>
        `This is excellent work that demonstrates mastery across both technical and artistic dimensions of photography. From a technical perspective, everything is precisely executed: exposure is perfect with well-preserved dynamic range, focus is critically sharp exactly where it needs to be, composition follows strong visual principles while avoiding formulaic application, and color rendition is accurate and aesthetically pleasing. Your camera settings were clearly chosen with intention and expertise. Equally impressive is the artistic achievement here. You've captured a genuinely meaningful moment with authentic emotional resonance. The light quality is exceptional - whether you waited for it, created it, or recognized and seized the opportunity, it elevates the entire image. Your framing decisions show sophisticated visual thinking, including what to exclude as much as what to include. There's a clear creative vision being realized, not just technical competence on display. The image works on multiple levels: immediate visual impact, compositional strength, technical quality, and deeper narrative or emotional content. This is the kind of photograph that demonstrates why photography is both craft and art. You've balanced all the elements beautifully. This represents mature, confident work from a photographer who understands their tools and has developed their artistic voice. Exceptional in every way.`,
    },
  ],
};

/**
 * GET /api/simulate-reviews
 * Generate simulated reviews for testing purposes
 * Only works in development mode
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Only allow in development mode
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "This endpoint is only available in development mode" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { photoId } = body;

    if (!photoId) {
      return NextResponse.json(
        { error: "Missing required field: photoId" },
        { status: 400 }
      );
    }

    // Validate photoId is a valid ObjectId
    if (!ObjectId.isValid(photoId)) {
      return NextResponse.json(
        { error: "Invalid photo ID format" },
        { status: 400 }
      );
    }

    // Get or create fake reviewers
    const usersCollection = await getCollection<UserDocument>(COLLECTIONS.USERS);
    const reviewsCollection = await getCollection<ReviewDocument>(COLLECTIONS.REVIEWS);

    const reviewerIds: string[] = [];

    // Create or get fake reviewer accounts
    for (const fakeReviewer of FAKE_REVIEWERS) {
      let user = await usersCollection.findOne({ email: fakeReviewer.email });

      if (!user) {
        // Create fake reviewer
        const newUser: Omit<UserDocument, "_id"> = {
          email: fakeReviewer.email,
          name: fakeReviewer.name,
          image: fakeReviewer.image,
          provider: fakeReviewer.provider,
          eloRating: 1000 + Math.floor(Math.random() * 400), // Random ELO 1000-1400
          totalReviews: Math.floor(Math.random() * 50), // Random review count
          photoCount: 0,
          joinedAt: new Date(),
        };

        const result = await usersCollection.insertOne(newUser as any);
        reviewerIds.push(result.insertedId.toString());
      } else {
        reviewerIds.push(user._id.toString());
      }
    }

    // Generate 5 reviews
    const generatedReviews = [];
    const photoNumber = Math.floor(Math.random() * 1000);

    for (let i = 0; i < 5; i++) {
      const reviewer = FAKE_REVIEWERS[i];
      const reviewerId = reviewerIds[i];

      // Check if this reviewer already reviewed this photo
      const existingReview = await reviewsCollection.findOne({
        photoId,
        reviewerId,
      });

      if (existingReview) {
        console.log(`Review already exists for reviewer ${reviewer.name}`);
        continue;
      }

      // Select random template for this expertise
      const templates = REVIEW_TEMPLATES[reviewer.expertise as keyof typeof REVIEW_TEMPLATES];
      const template = templates[Math.floor(Math.random() * templates.length)];
      const comment = template.template(photoNumber);
      const wordCount = comment.trim().split(/\s+/).length;

      // Create review with approved status
      const reviewData: Omit<ReviewDocument, "_id"> = {
        photoId,
        reviewerId,
        score: template.score,
        comment,
        wordCount,
        moderationStatus: "approved",
        aiAnalysis: {
          isOffensive: false,
          isAiGenerated: false,
          isRelevant: true,
          confidence: 95,
          reasoning: "Simulated review - auto-approved for testing",
        },
        createdAt: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
      };

      const result = await reviewsCollection.insertOne(reviewData as any);

      // Increment photo review count
      await incrementPhotoReviewCount(photoId);

      generatedReviews.push({
        _id: result.insertedId.toString(),
        reviewerName: reviewer.name,
        ...reviewData,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Generated ${generatedReviews.length} simulated reviews`,
        reviews: generatedReviews.map((r) => ({
          id: r._id,
          reviewer: r.reviewerName,
          score: r.score,
          wordCount: r.wordCount,
          expertise: FAKE_REVIEWERS.find((f) => f.name === r.reviewerName)?.expertise,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Simulate reviews error:", error);
    return NextResponse.json(
      { error: "Failed to generate simulated reviews" },
      { status: 500 }
    );
  }
}
