
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Upload, AlertTriangle, Eye, Zap, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">SafeShare</h1>
            <Button onClick={() => navigate("/upload")} className="bg-purple-600 hover:bg-purple-700">
              Upload Content
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <section className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            AI-Powered Content Moderation for a Safe & Creative Social Media Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Welcome to our platform — the place where your creativity knows no bounds, 
            and your safety is always a top priority.
          </p>
        </section>
        
        <section className="mb-16">
          <Card className="bg-purple-50 border-purple-100">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-purple-900">How It Works</CardTitle>
              <CardDescription className="text-purple-700">
                Every single upload goes through an advanced, AI-based moderation process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard 
                  icon={<Shield className="h-8 w-8 text-purple-600" />}
                  title="Personal Data Protection"
                  description="Phone numbers, addresses, passwords, ID cards are detected, flagged, and protected."
                />
                <FeatureCard 
                  icon={<AlertTriangle className="h-8 w-8 text-purple-600" />}
                  title="Safety First"
                  description="Violence, hate speech & bullying are detected and prevented from appearing."
                />
                <FeatureCard 
                  icon={<Eye className="h-8 w-8 text-purple-600" />}
                  title="Content Screening"
                  description="Nudity & explicit content is automatically recognized and prevented from uploading."
                />
                <FeatureCard 
                  icon={<Shield className="h-8 w-8 text-purple-600" />}
                  title="Risk Prevention"
                  description="Self-harm or dangerous challenges are flagged before reaching followers."
                />
                <FeatureCard 
                  icon={<Zap className="h-8 w-8 text-purple-600" />}
                  title="Deepfake Detection"
                  description="We analyze for signs of fake or altered content to prevent disinformation."
                />
                <FeatureCard 
                  icon={<CheckCircle className="h-8 w-8 text-purple-600" />}
                  title="Instant Feedback"
                  description="You'll be notified immediately if content needs changes or can't be posted."
                />
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="p-8 md:w-1/2">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Who's Doing the Checking?</h3>
                <p className="text-gray-600 mb-6">
                  Our AI system runs on advanced language models, audio recognition, and visual context analysis.
                  We protect your privacy - no content is stored or shared with third parties.
                </p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">TL;DR:</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> You film.</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> I screen.</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Everyone stays safe.</li>
                  </ul>
                </div>
              </div>
              <div className="bg-purple-600 p-8 text-white md:w-1/2 flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Create boldly. We've got your back.</h3>
                  <Button 
                    onClick={() => navigate("/upload")} 
                    variant="outline" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                  >
                    <Upload className="mr-2 h-4 w-4" /> Start Uploading
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default Index;
