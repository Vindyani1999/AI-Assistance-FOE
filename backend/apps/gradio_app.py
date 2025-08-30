import gradio as gr
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.core.chatbot.chatbot_backend import ChatBot
from src.core.utils.ui_settings import UISettings



with gr.Blocks(css="""
.transparent-btn {
    background: transparent !important;
    border: 1px solid rgba(255, 255, 255, 0.3) !important;
    color: white !important;
    transition: all 0.3s ease !important;
}
.transparent-btn:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border: 1px solid rgba(255, 255, 255, 0.5) !important;
}
.agent-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: flex-start !important;
    padding: 8px 12px !important;
}
.agent-btn img {
    width: 20px !important;
    height: 20px !important;
    margin-right: 8px !important;
    border-radius: 3px !important;
}
""") as demo:
    with gr.Tabs():
        with gr.TabItem("Guidance Agent"):
            with gr.Row():
                # Main chat area
                with gr.Column(scale=9):
                    ##############
                    # First ROW:
                    ##############
                    with gr.Row() as row_one:
                        chatbot = gr.Chatbot(
                            [],
                            elem_id="chatbot",
                            bubble_full_width=False,
                            height=500,
                            avatar_images=(
                                ("../images/AI_RT.png"), "../images/openai.png"),
                            # render=False
                        )
                        # **Adding like/dislike icons
                        chatbot.like(UISettings.feedback, None, None)
                    ##############
                    # SECOND ROW:
                    ##############
                    with gr.Row():
                        input_txt = gr.Textbox(
                            lines=3,
                            scale=8,
                            placeholder="Type a message...",
                            container=False,
                            show_copy_button=True
                        )
                        # Send button with icon
                        send_btn = gr.Button(
                            value="📤",
                            variant="primary",
                            size="sm",
                            scale=1,
                            min_width=50
                        )
                        # Clear button
                        clear_btn = gr.Button(
                            value="🗑️",
                            variant="secondary", 
                            size="sm",
                            scale=1,
                            min_width=50
                        )

                    ##############
                    # Third ROW: (removed old buttons)
                    ##############
                    ##############
                    # Process:
                    ##############
                    txt_msg = input_txt.submit(fn=ChatBot.respond,
                                               inputs=[chatbot, input_txt],
                                               outputs=[input_txt,
                                                        chatbot],
                                               queue=False).then(lambda: gr.Textbox(interactive=True),
                                                                 None, [input_txt], queue=False)

                    # Send button click handler
                    send_msg = send_btn.click(fn=ChatBot.respond,
                                            inputs=[chatbot, input_txt],
                                            outputs=[input_txt,
                                                     chatbot],
                                            queue=False).then(lambda: gr.Textbox(interactive=True),
                                                              None, [input_txt], queue=False)
                    
                    # Clear button handler
                    clear_btn.click(lambda: ("", []), outputs=[input_txt, chatbot])
                
                # # Right sidebar for other agents
                # with gr.Column(scale=1/2, min_width=40):
                #     gr.Markdown("### ")
                    
                #     # Images column
                #     booking_image = gr.Image("../images/booking_agent.png", 
                #             label=False, 
                #             interactive=False, 
                #             show_label=False, 
                #             show_download_button=False,
                #             show_fullscreen_button=False, 
                #             height=40,
                #             width=30)
                    
                #     planner_image = gr.Image("../images/AI_RT.png", 
                #             label=False, 
                #             interactive=False, 
                #             show_label=False, 
                #             show_download_button=False,
                #             show_fullscreen_button=False, 
                #             height=40,
                #             width=30)
                
                # Buttons column
                with gr.Column(scale=1.2, min_width=40):
                    gr.Markdown("### ")
                    
                    # # Submit Text Button (moved here)
                    # text_submit_btn = gr.Button(
                    #     value="📝 Submit Text",
                    #     variant="primary",
                    #     elem_classes="transparent-btn agent-btn",
                    #     elem_id="text_submit_btn"
                    # ).click(
                    #     fn=ChatBot.respond,
                    #     inputs=[chatbot, input_txt],
                    #     outputs=[input_txt, chatbot],
                    #     queue=False
                    # ).then(lambda: gr.Textbox(interactive=True),
                    #        None, [input_txt], queue=False)
                    
                    # Booking Agent Button
                    gr.Button(
                        value="📅 Booking Agent",
                        variant="secondary",
                        elem_classes="transparent-btn agent-btn",
                        elem_id="booking_agent_btn"
                    ).click(
                        fn=lambda: None,
                        js="() => window.open('https://www.youtube.com/watch?v=FwOTs4UxQS4', '_blank')"
                    )
                    
                    # Planner Agent Button
                    gr.Button(
                        value="📋 Planner Agent",
                        variant="secondary",
                        elem_classes="transparent-btn agent-btn",
                        elem_id="planner_agent_btn"
                    ).click(
                        fn=lambda: None,
                        js="() => window.open('http://localhost:7862', '_blank')"
                    )


if __name__ == "__main__":
    demo.launch()
